import type { RedisService } from '../../redis/redis.module';

interface ZEntry {
  score: number;
  member: string;
}

/**
 * 内存版 Redis（只实现本模块用到的命令子集），供单元测试使用。
 * 时钟取 Date.now()，配合 vitest 的 vi.useFakeTimers / vi.setSystemTime 可完全确定时间行为。
 */
export class FakeRedis {
  private strings = new Map<string, string>();
  private zsets = new Map<string, ZEntry[]>();
  private expires = new Map<string, number>(); // key → 绝对过期时刻（ms）

  /** 当前存活的全部键（字符串 + zset，断言 / 预置用） */
  get keys(): string[] {
    return [...new Set([...this.strings.keys(), ...this.zsets.keys()])].filter(
      (k) => !this.expired(k),
    );
  }

  async get(key: string): Promise<string | null> {
    if (this.expired(key)) return null;
    return this.strings.get(key) ?? null;
  }

  async set(
    key: string,
    value: string,
    _ex: 'EX',
    seconds: number,
    nx?: 'NX',
  ): Promise<'OK' | null> {
    if (this.expired(key)) this.cleanup(key);
    if (nx === 'NX' && this.strings.has(key)) return null;
    this.strings.set(key, value);
    this.expires.set(key, Date.now() + seconds * 1000);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = !this.expired(key) && (this.strings.has(key) || this.zsets.has(key));
    this.cleanup(key);
    return existed ? 1 : 0;
  }

  async zremrangebyscore(key: string, min: string, max: string): Promise<number> {
    const set = this.zsets.get(key);
    if (!set || this.expired(key)) return 0;
    const lo = min === '-inf' ? Number.NEGATIVE_INFINITY : Number(min);
    const hi = max === 'inf' ? Number.POSITIVE_INFINITY : Number(max);
    const rest = set.filter((e) => e.score < lo || e.score > hi);
    const removed = set.length - rest.length;
    this.zsets.set(key, rest);
    return removed;
  }

  async zcard(key: string): Promise<number> {
    if (this.expired(key)) return 0;
    return this.zsets.get(key)?.length ?? 0;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (this.expired(key)) this.cleanup(key);
    const set = this.zsets.get(key) ?? [];
    const rest = set.filter((e) => e.member !== member); // ZADD 同 member 替换
    rest.push({ score, member });
    this.zsets.set(key, rest);
    this.expires.delete(key); // 重新等 pexpire 续期
    return set.length === rest.length ? 1 : 0;
  }

  async pexpire(key: string, milliseconds: number): Promise<number> {
    if (!this.strings.has(key) && !this.zsets.has(key)) return 0;
    this.expires.set(key, Date.now() + milliseconds);
    return 1;
  }

  private expired(key: string): boolean {
    const deadline = this.expires.get(key);
    return deadline !== undefined && Date.now() >= deadline;
  }

  private cleanup(key: string): void {
    this.strings.delete(key);
    this.zsets.delete(key);
    this.expires.delete(key);
  }
}

/**
 * 以 RedisService 类型注入守卫 / 拦截器（构造器注入的具体类），运行时是 FakeRedis。
 * 断言是刻意的：实现只使用上述命令子集，ioredis 的完整类型对测试无意义。
 */
export function fakeRedisService(fake: FakeRedis = new FakeRedis()): RedisService {
  return { client: fake } as unknown as RedisService;
}
