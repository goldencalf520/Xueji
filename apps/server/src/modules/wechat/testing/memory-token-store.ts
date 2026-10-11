import type { WechatTokenStore } from '../wechat.token-store';

interface Entry {
  value: string;
  expiresAt: number;
}

/** 内存版令牌存储（单元测试用）：行为与 RedisWechatTokenStore 对齐，可断言 TTL 与锁 */
export class MemoryTokenStore implements WechatTokenStore {
  private readonly values = new Map<string, Entry>();
  private readonly locks = new Map<string, Entry>();
  private lockSeq = 0;

  /** 每次 set 写入的（键, TTL 秒），用于断言提前刷新窗口 */
  readonly writtenTtl: Array<{ key: string; ttlSec: number }> = [];
  /** 成功释放锁的次数 */
  releaseCount = 0;

  async get(key: string): Promise<string | null> {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSec: number): Promise<void> {
    this.values.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
    this.writtenTtl.push({ key, ttlSec });
  }

  async acquireLock(key: string, ttlSec: number): Promise<string | null> {
    if (this.peekLock(key)) return null;
    this.lockSeq += 1;
    const token = `lock-${this.lockSeq}`;
    this.locks.set(key, { value: token, expiresAt: Date.now() + ttlSec * 1000 });
    return token;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    if (this.peekLock(key) === token) {
      this.locks.delete(key);
      this.releaseCount += 1;
    }
  }

  async del(key: string): Promise<void> {
    this.values.delete(key);
  }

  /** 测试预置：直接往缓存里放一个令牌 */
  seed(key: string, value: string, ttlSec = 7200): void {
    this.values.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
  }

  /** 测试断言：某个键当前是否被别人持锁 */
  isLocked(key: string): boolean {
    return this.peekLock(key) !== null;
  }

  private peekLock(key: string): string | null {
    const entry = this.locks.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.locks.delete(key);
      return null;
    }
    return entry.value;
  }
}
