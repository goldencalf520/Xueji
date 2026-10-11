import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@xueji/shared';
import { BizException } from '../errors/biz.exception';
import { AuthConfig } from './auth.config';
import {
  type AccessTokenPayload,
  type Audience,
  type IssueTokensInput,
  isStaffAudience,
  type Principal,
  type PrincipalClaims,
  type RefreshTokenPayload,
  TOKEN_ISSUER,
  toClaims,
} from './principal';
import { TokenFamilyStore } from './token-family.store';

/** 签发结果 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** 访问令牌有效期（秒），客户端据此做过期处理 */
  expiresIn: number;
}

function unauthorized(message?: string, data?: unknown): BizException {
  return new BizException(ErrorCode.UNAUTHORIZED, message, data);
}

/**
 * 令牌签发 / 验证 / 刷新轮换（SRV-03，§12.1、§13.5）。
 *
 * - 访问令牌：按 aud 用独立密钥签发，无状态校验（不查 Redis），默认 2 小时；
 * - 刷新令牌：Redis 保存令牌族，每次使用轮换新 jti；旧刷新令牌被重复使用（jti 不再是族内
 *   最新值）视为泄露，吊销整个族并要求重新登录；
 * - 后台（admin / hospital）刷新时校验最后活动时间，超过无操作退出时长（默认 30 分钟，
 *   §6.2.1）吊销族并要求重新登录。
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly store: TokenFamilyStore,
    private readonly config: AuthConfig,
  ) {}

  /** 登录成功后签发一对令牌并建立令牌族 */
  async issueTokens(input: IssueTokensInput): Promise<TokenPair> {
    if (input.guest === true && input.aud !== 'app') {
      throw new Error('访客令牌（guest）只允许用户端（app）签发');
    }
    const claims = toClaims(input);
    const fam = randomUUID();
    const jti = randomUUID();
    const accessToken = await this.signAccess(input.aud, input.sub, claims);
    const refreshToken = await this.signRefresh(input.aud, input.sub, fam, jti);
    const ttl = this.config.refreshTtlSeconds(input.aud);
    await this.store.create(fam, { aud: input.aud, sub: input.sub, currentJti: jti, claims }, ttl);
    if (isStaffAudience(input.aud)) {
      await this.store.touchActivity(input.aud, input.sub, this.config.staffIdleSeconds);
    }
    return { accessToken, refreshToken, expiresIn: this.config.accessTtlSeconds };
  }

  /**
   * 校验访问令牌。expectedAud 来自路由前缀（AuthGuard 推断）：用哪端的密钥验签，
   * 跨端令牌（签发方不同）必然验签失败——这是三端隔离的实现点。
   */
  async verifyAccessToken(token: string, expectedAud: Audience): Promise<Principal> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.secrets[expectedAud],
        audience: expectedAud,
        issuer: TOKEN_ISSUER,
      });
    } catch {
      throw unauthorized();
    }
    if (payload.typ !== 'access' || payload.aud !== expectedAud || typeof payload.pl !== 'object') {
      throw unauthorized();
    }
    return { aud: payload.aud, sub: payload.sub, ...payload.pl };
  }

  /**
   * 刷新令牌轮换。旧刷新令牌被重复使用时吊销整个令牌族（重放检测）；
   * 后台超过无操作退出时长同样吊销族、要求重新登录。
   */
  async rotateRefreshToken(refreshToken: string, expectedAud: Audience): Promise<TokenPair> {
    const payload = await this.verifyRefresh(refreshToken, expectedAud);

    const record = await this.store.find(payload.fam);
    if (record === null) {
      // 族不存在：已过期 / 已吊销
      throw unauthorized('登录已过期，请重新登录');
    }
    if (record.currentJti !== payload.jti) {
      // 旧刷新令牌被再次使用：疑似泄露，吊销整个族
      await this.store.revoke(payload.fam, record.aud, record.sub);
      throw unauthorized('登录状态异常，请重新登录');
    }

    if (isStaffAudience(record.aud)) {
      const idleMs = this.config.staffIdleSeconds * 1000;
      const lastMs = await this.store.lastActivityMs(record.aud, record.sub);
      if (lastMs === null || Date.now() - lastMs > idleMs) {
        await this.store.revoke(payload.fam, record.aud, record.sub);
        throw unauthorized('长时间未操作，请重新登录');
      }
    }

    const newJti = randomUUID();
    const newAccessToken = await this.signAccess(record.aud, record.sub, record.claims);
    const newRefreshToken = await this.signRefresh(record.aud, record.sub, payload.fam, newJti);
    await this.store.rotate(
      payload.fam,
      record.aud,
      record.sub,
      newJti,
      this.config.refreshTtlSeconds(record.aud),
    );
    if (isStaffAudience(record.aud)) {
      await this.store.touchActivity(record.aud, record.sub, this.config.staffIdleSeconds);
    }
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.config.accessTtlSeconds,
    };
  }

  /** 登出全部设备 / 员工停用 / 医院账号停用：吊销该主体全部令牌族 */
  async revokeAllFor(aud: Audience, sub: string): Promise<number> {
    return this.store.revokeAll(aud, sub);
  }

  /** 记录后台活动时间（AuthGuard 每次请求调用，尽力而为）；用户端无需记录 */
  async touchActivity(aud: Audience, sub: string): Promise<void> {
    if (!isStaffAudience(aud)) return;
    await this.store.touchActivity(aud, sub, this.config.staffIdleSeconds);
  }

  private async verifyRefresh(token: string, expectedAud: Audience): Promise<RefreshTokenPayload> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.secrets[expectedAud],
        audience: expectedAud,
        issuer: TOKEN_ISSUER,
      });
    } catch {
      throw unauthorized();
    }
    if (
      payload.typ !== 'refresh' ||
      payload.aud !== expectedAud ||
      typeof payload.fam !== 'string'
    ) {
      throw unauthorized();
    }
    return payload;
  }

  private signAccess(aud: Audience, sub: string, claims: PrincipalClaims): Promise<string> {
    return this.jwt.signAsync(
      { typ: 'access', pl: claims },
      {
        secret: this.config.secrets[aud],
        audience: aud,
        issuer: TOKEN_ISSUER,
        subject: sub,
        jwtid: randomUUID(),
        expiresIn: this.config.accessTtlSeconds,
      },
    );
  }

  private signRefresh(aud: Audience, sub: string, fam: string, jti: string): Promise<string> {
    return this.jwt.signAsync(
      { typ: 'refresh', fam },
      {
        secret: this.config.secrets[aud],
        audience: aud,
        issuer: TOKEN_ISSUER,
        subject: sub,
        jwtid: jti,
        expiresIn: this.config.refreshTtlSeconds(aud),
      },
    );
  }
}
