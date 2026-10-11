import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@xueji/shared';
import { BizException } from '../errors/biz.exception';
import { RedisService } from '../redis/redis.module';
import { ANTI_REPLAY_KEY } from './anti-replay.decorator';
import { type AuthenticatedRequest, audienceOf } from './request-context';

/** 允许的时钟偏差：±5 分钟（§14.2） */
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
/** nonce 去重保留时长：10 分钟（覆盖时钟偏差窗口的 2 倍） */
export const NONCE_TTL_SEC = 10 * 60;

/** nonce 格式：8–128 个可打印 ASCII 字符（uuid / nanoid / 随机串均可） */
const NONCE_PATTERN = /^[\x21-\x7e]{8,128}$/;

/**
 * 解析 X-Timestamp：接受毫秒或秒级 Unix 时间。
 * 以 1e12 为界（2001-09-09 的毫秒值）：小于它视为秒级，自动换算为毫秒。
 */
function parseTimestamp(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value < 1e12 ? value * 1000 : value;
}

/**
 * 防重放守卫（§14.2）：校验 X-Timestamp（±5 分钟）与 X-Nonce（10 分钟内唯一）。
 * 用于登录、短信、导出等敏感接口；时间戳过期 / nonce 重复 / 缺头均被拒绝。
 */
@Injectable()
export class AntiReplayGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const marked = this.reflector.getAllAndOverride<boolean>(ANTI_REPLAY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!marked) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const timestamp = req.header('X-Timestamp');
    const nonce = req.header('X-Nonce');
    if (!timestamp || !nonce) {
      throw new BizException(ErrorCode.INVALID_PARAMS, '请求缺少时间戳或随机数，请刷新后重试');
    }
    if (!NONCE_PATTERN.test(nonce)) {
      throw new BizException(ErrorCode.INVALID_PARAMS, '请求随机数格式有误');
    }

    const ts = parseTimestamp(timestamp);
    if (ts === null) {
      throw new BizException(ErrorCode.INVALID_PARAMS, '请求时间格式有误');
    }
    const now = Date.now();
    if (Math.abs(now - ts) > MAX_CLOCK_SKEW_MS) {
      throw new BizException(ErrorCode.INVALID_PARAMS, '请求已过期，请校准时间后重试');
    }

    // nonce 10 分钟内唯一（SET NX）：重复即视为重放
    const claimed = await this.redisService.client.set(
      `xueji:nonce:${audienceOf(req)}:${nonce}`,
      String(now),
      'EX',
      NONCE_TTL_SEC,
      'NX',
    );
    if (claimed !== 'OK') {
      throw new BizException(ErrorCode.CONFLICT, '请勿重复提交');
    }
    return true;
  }
}
