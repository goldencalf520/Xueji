import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.module';
import type { Audience, PrincipalClaims } from './principal';

/**
 * 刷新令牌族存储（Redis）。
 *
 * 一个「令牌族」= 一次登录产生的所有刷新令牌（轮换链）。族内只有最新的 jti 有效；
 * 旧 jti 被再次使用视为重放，吊销整个族（OWASP 刷新令牌轮换语义）。
 * 登出、员工停用、医院账号停用吊销该主体的全部族。
 *
 * 键布局（均有 TTL，随轮换续期）：
 *   auth:fam:{fam}          HASH  aud / sub / jti / pl（身份快照 JSON）
 *   auth:subj:{aud}:{sub}   SET   该主体的全部族 ID
 *   auth:act:{aud}:{sub}     STR  后台最后活动时间（epoch ms），TTL = 无操作退出时长
 */
@Injectable()
export class TokenFamilyStore {
  constructor(private readonly redis: RedisService) {}

  private get client() {
    return this.redis.client;
  }

  private famKey(fam: string) {
    return `auth:fam:${fam}`;
  }

  private subjKey(aud: Audience, sub: string) {
    return `auth:subj:${aud}:${sub}`;
  }

  private actKey(aud: Audience, sub: string) {
    return `auth:act:${aud}:${sub}`;
  }

  async create(
    fam: string,
    record: { aud: Audience; sub: string; currentJti: string; claims: PrincipalClaims },
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.famKey(fam);
    await this.client.hset(key, {
      aud: record.aud,
      sub: record.sub,
      jti: record.currentJti,
      pl: JSON.stringify(record.claims),
    });
    await this.client.expire(key, ttlSeconds);
    await this.registerFamily(record.aud, record.sub, fam, ttlSeconds);
  }

  async find(
    fam: string,
  ): Promise<{ aud: Audience; sub: string; currentJti: string; claims: PrincipalClaims } | null> {
    const h = await this.client.hgetall(this.famKey(fam));
    const { aud, sub, jti, pl } = h ?? {};
    if (!aud || !sub || !jti || !pl) return null;
    return {
      aud: aud as Audience,
      sub,
      currentJti: jti,
      claims: JSON.parse(pl) as PrincipalClaims,
    };
  }

  /** 轮换：更新族内有效 jti 并续期 */
  async rotate(
    fam: string,
    aud: Audience,
    sub: string,
    newJti: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.famKey(fam);
    await this.client.hset(key, 'jti', newJti);
    await this.client.expire(key, ttlSeconds);
    await this.registerFamily(aud, sub, fam, ttlSeconds);
  }

  /** 吊销单个族（重放检测、单设备登出） */
  async revoke(fam: string, aud: Audience, sub: string): Promise<void> {
    await this.client.del(this.famKey(fam));
    await this.client.srem(this.subjKey(aud, sub), fam);
  }

  /** 吊销该主体的全部族（登出全部设备、员工停用、医院账号停用） */
  async revokeAll(aud: Audience, sub: string): Promise<number> {
    const key = this.subjKey(aud, sub);
    const families = await this.client.smembers(key);
    if (families.length === 0) return 0;
    for (const fam of families) {
      await this.client.del(this.famKey(fam));
    }
    await this.client.del(key);
    return families.length;
  }

  /** 后台最后活动时间（epoch ms）；键过期 / 从未记录返回 null（视为已超时） */
  async lastActivityMs(aud: Audience, sub: string): Promise<number | null> {
    const value = await this.client.get(this.actKey(aud, sub));
    if (value === null || value.length === 0) return null;
    const ms = Number(value);
    return Number.isFinite(ms) ? ms : null;
  }

  /** 记录后台活动时间；键的 TTL = 无操作退出时长，过期即超时 */
  async touchActivity(aud: Audience, sub: string, idleSeconds: number): Promise<void> {
    const key = this.actKey(aud, sub);
    await this.client.set(key, String(Date.now()), 'EX', idleSeconds);
  }

  private async registerFamily(aud: Audience, sub: string, fam: string, ttlSeconds: number) {
    const key = this.subjKey(aud, sub);
    await this.client.sadd(key, fam);
    await this.client.expire(key, ttlSeconds);
  }
}
