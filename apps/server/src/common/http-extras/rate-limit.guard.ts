import { randomUUID } from 'node:crypto';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@xueji/shared';
import { BizException } from '../errors/biz.exception';
import { RedisService } from '../redis/redis.module';
import { type HttpExtrasEnv, loadHttpExtrasEnv } from './http-extras.config';
import { RATE_LIMIT_KEY, type RateLimitOptions } from './rate-limit.decorator';
import {
  type AuthenticatedRequest,
  isHealthPath,
  principalOf,
  routeTemplateOf,
} from './request-context';

/**
 * 限流守卫（§14.2）：Redis ZSET 滑动窗口。
 *
 * 两层生效：
 * 1. 路由级：@RateLimit({ key, limit, windowSec })，限流桶按“路由模板 + 主体”聚合；
 * 2. 全局默认：按 IP 的总量限制（RATE_LIMIT_GLOBAL_* 环境变量配置），健康检查除外。
 *
 * 计数存在微小并发窗口（ZCARD 与 ZADD 非原子，极端并发下略放宽），对限流场景可接受。
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly config: HttpExtrasEnv;

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {
    this.config = loadHttpExtrasEnv();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 路由级限流（类或方法上声明均可）
    const routeOptions = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (routeOptions) {
      validateRouteOptions(routeOptions);
      await this.check(req, `r_${routeTemplateOf(req)}_${routeOptions.key}`, routeOptions);
    }

    // 全局默认限流（按 IP 总量；探活端点除外）
    if (this.config.RATE_LIMIT_GLOBAL_ENABLED && !isHealthPath(req)) {
      await this.check(req, 'g_ip', {
        key: 'ip',
        limit: this.config.RATE_LIMIT_GLOBAL_LIMIT,
        windowSec: this.config.RATE_LIMIT_GLOBAL_WINDOW_SEC,
      });
    }
    return true;
  }

  /** 滑动窗口计数：窗口内已有 limit 条记录则拒绝（42900） */
  private async check(
    req: AuthenticatedRequest,
    bucket: string,
    options: RateLimitOptions,
  ): Promise<void> {
    const principal = options.key === 'user' ? principalOf(req) : `ip:${req.ip ?? 'unknown'}`; // 'ip' 模式显式用 IP，避免误用登录主体
    const redisKey = `xueji:rl:${bucket}:${principal}`;
    const now = Date.now();
    const windowMs = options.windowSec * 1000;
    const redis = this.redisService.client;

    // 清理窗口外的旧记录，统计窗口内数量
    await redis.zremrangebyscore(redisKey, '-inf', String(now - windowMs));
    const count = Number((await redis.zcard(redisKey)) ?? 0);
    if (count >= options.limit) {
      throw new BizException(ErrorCode.TOO_MANY_REQUESTS);
    }
    // member 需要全局唯一：同毫秒的两次请求不能互相覆盖（ZADD 同 member 会替换）
    await redis.zadd(redisKey, now, `${now}:${req.id ?? randomUUID()}`);
    // 窗口 + 1s 缓冲续期，避免键在仍有成员时被过期清理
    await redis.pexpire(redisKey, windowMs + 1000);
  }
}

function validateRouteOptions(options: RateLimitOptions): void {
  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error('@RateLimit 的 limit 必须是 >= 1 的整数');
  }
  if (!Number.isInteger(options.windowSec) || options.windowSec < 1 || options.windowSec > 3600) {
    throw new Error('@RateLimit 的 windowSec 必须是 1–3600 的整数（秒）');
  }
  if (options.key !== 'ip' && options.key !== 'user') {
    throw new Error("@RateLimit 的 key 只能是 'ip' 或 'user'");
  }
}
