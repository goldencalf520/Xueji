import { type CanActivate, type ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_PREFIX, ErrorCode } from '@xueji/shared';
import type { Request } from 'express';
import { BizException } from '../errors/biz.exception';
import { PUBLIC_KEY, REQUIRE_PHONE_KEY } from './decorators';
import { type Audience, isStaffAudience, type Principal } from './principal';
import { TokenService } from './token.service';

/**
 * 按路径推断期望的端：/api/v1/app/** → app，/api/v1/admin/** → admin，
 * /api/v1/hospital/** → hospital；其它路径（webhook、health、docs 等基础设施路由）
 * 不在三端鉴权范围，返回 null。
 */
export function audienceOfPath(path: string): Audience | null {
  for (const aud of ['app', 'admin', 'hospital'] as const) {
    const prefix = API_PREFIX[aud];
    if (path === prefix || path.startsWith(`${prefix}/`)) return aud;
  }
  return null;
}

/**
 * 全局鉴权守卫（SRV-03，§12.1、§13.5）。
 *
 * - 路由前缀推断期望 aud，用该端独立密钥验签：跨端令牌必失败 → 40001；
 * - `@Public()` 放行（webhook 与其它非三端路由天然放行）；
 * - 校验通过把 Principal 挂到 request.user（`@CurrentUser()` 读取）；
 * - `@RequirePhone()`：访客（未绑手机号）→ 40011；
 * - 后台每次请求刷新最后活动时间（尽力而为，失败不影响请求）。
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: Principal }>();
    const expectedAud = audienceOfPath(req.path);
    if (expectedAud === null) return true;

    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets)) return true;

    const principal = await this.authenticate(req, expectedAud);
    req.user = principal;

    if (
      this.reflector.getAllAndOverride<boolean>(REQUIRE_PHONE_KEY, targets) &&
      principal.guest === true
    ) {
      throw new BizException(ErrorCode.PHONE_REQUIRED);
    }

    if (isStaffAudience(principal.aud)) {
      // 尽力而为：活动时间记录失败不影响本次请求
      this.tokens.touchActivity(principal.aud, principal.sub).catch((err: unknown) => {
        this.logger.warn(
          `记录后台活动时间失败：${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }
    return true;
  }

  private async authenticate(req: Request, expectedAud: Audience): Promise<Principal> {
    const header = req.headers.authorization;
    if (header === undefined || !header.startsWith('Bearer ')) {
      throw new BizException(ErrorCode.UNAUTHORIZED);
    }
    return this.tokens.verifyAccessToken(header.slice('Bearer '.length).trim(), expectedAud);
  }
}
