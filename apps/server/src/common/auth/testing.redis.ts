/**
 * 单元测试用的内存 Redis 假实现：只实现 TokenFamilyStore 用到的命令子集
 * （hset / hgetall / expire / del / sadd / smembers / srem / get / set），
 * 以及 e2e 起完整应用时全局 RateLimitGuard 用到的 ZSET 子集
 * （zadd / zremrangebyscore / zcard / pexpire），
 * 含 TTL 语义（过期键惰性清理），不依赖真实 Redis。
 */

export class FakeRedis {
  private hashes = new Map<string, Record<string, string>>();
  private sets = new Map<string, Set<string>>();
  private strings = new Map<string, string>();
  private zsets = new Map<string, { score: number; member: string }[]>();
  private expires = new Map<string, number>();

  /** 直接写入底层字符串键（测试用来伪造活动时间等） */
  setRawString(key: string, value: string) {
    this.strings.set(key, value);
  }

  /** 让某键立即过期（测试模拟 TTL 到期） */
  forceExpire(key: string) {
    this.expires.set(key, 0);
  }

  async hset(key: string, fieldOrObject: string | Record<string, string>, value?: string) {
    this.sweep(key);
    const hash = this.hashes.get(key) ?? {};
    if (typeof fieldOrObject === 'string') {
      hash[fieldOrObject] = value ?? '';
    } else {
      Object.assign(hash, fieldOrObject);
    }
    this.hashes.set(key, hash);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    this.sweep(key);
    return { ...(this.hashes.get(key) ?? {}) };
  }

  async expire(key: string, seconds: number) {
    this.expires.set(key, Date.now() + seconds * 1000);
  }

  async del(key: string) {
    this.hashes.delete(key);
    this.sets.delete(key);
    this.strings.delete(key);
    this.zsets.delete(key);
    this.expires.delete(key);
  }

  async sadd(key: string, member: string) {
    const set = this.sets.get(key) ?? new Set<string>();
    set.add(member);
    this.sets.set(key, set);
  }

  async smembers(key: string): Promise<string[]> {
    this.sweep(key);
    return [...(this.sets.get(key) ?? new Set<string>())];
  }

  async srem(key: string, member: string) {
    this.sets.get(key)?.delete(member);
  }

  async get(key: string): Promise<string | null> {
    this.sweep(key);
    return this.strings.get(key) ?? null;
  }

  async set(
    key: string,
    value: string,
    mode?: 'EX',
    seconds?: number,
    nx?: 'NX',
  ): Promise<'OK' | null> {
    this.sweep(key);
    if (nx === 'NX' && this.strings.has(key)) return null;
    if (mode === 'EX' && seconds !== undefined) {
      this.expires.set(key, Date.now() + seconds * 1000);
    }
    this.strings.set(key, value);
    return 'OK';
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    this.sweep(key);
    const zset = this.zsets.get(key) ?? [];
    const rest = zset.filter((e) => e.member !== member); // ZADD 同 member 替换
    rest.push({ score, member });
    this.zsets.set(key, rest);
    return zset.length === rest.length ? 0 : 1;
  }

  async zremrangebyscore(key: string, min: string, max: string): Promise<number> {
    this.sweep(key);
    const zset = this.zsets.get(key);
    if (!zset) return 0;
    const lo = min === '-inf' ? Number.NEGATIVE_INFINITY : Number(min);
    const hi = max === '+inf' || max === 'inf' ? Number.POSITIVE_INFINITY : Number(max);
    const rest = zset.filter((e) => e.score < lo || e.score > hi);
    this.zsets.set(key, rest);
    return zset.length - rest.length;
  }

  async zcard(key: string): Promise<number> {
    this.sweep(key);
    return this.zsets.get(key)?.length ?? 0;
  }

  async pexpire(key: string, milliseconds: number): Promise<number> {
    this.sweep(key);
    const exists =
      this.hashes.has(key) || this.sets.has(key) || this.strings.has(key) || this.zsets.has(key);
    if (!exists) return 0;
    this.expires.set(key, Date.now() + milliseconds);
    return 1;
  }

  /** TTL 到期的键惰性清理 */
  private sweep(key: string) {
    const at = this.expires.get(key);
    if (at !== undefined && at <= Date.now()) {
      this.hashes.delete(key);
      this.sets.delete(key);
      this.strings.delete(key);
      this.zsets.delete(key);
      this.expires.delete(key);
    }
  }
}

/** 以假 Redis 提供 RedisService 形状（overrideProvider 用） */
export function fakeRedisService(fake: FakeRedis): { client: FakeRedis } {
  return { client: fake };
}
