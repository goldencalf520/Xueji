import { randomUUID } from 'node:crypto';
import type { RedisService } from '../../common/redis/redis.module';

/**
 * access_token 的存储抽象（SRV-10 / #29）。
 *
 * 抽出接口有两个目的：单元测试可以换成内存实现（不需要真 Redis）；令牌刷新逻辑不直接依赖
 * ioredis 的具体命令。生产实现见 {@link RedisWechatTokenStore}。
 */
export interface WechatTokenStore {
  get(key: string): Promise<string | null>;
  /** 写入并设置 TTL（秒） */
  set(key: string, value: string, ttlSec: number): Promise<void>;
  /** 分布式锁（SET NX EX）：拿到锁返回锁令牌，没抢到返回 null */
  acquireLock(key: string, ttlSec: number): Promise<string | null>;
  /** 释放锁，只删自己持有的锁，避免把别人的锁删掉 */
  releaseLock(key: string, token: string): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * Redis 实现。
 *
 * 注意：释放锁是 `GET` + 比对 + `DEL`（非原子）。锁 TTL 只有 10 秒，最坏情况是「别人的锁过期后
 * 被自己删掉」，后果仅仅是多取一次 access_token（微信允许少量重复取用），因此不引入 Lua 脚本。
 */
export class RedisWechatTokenStore implements WechatTokenStore {
  constructor(private readonly redis: RedisService) {}

  async get(key: string): Promise<string | null> {
    return this.redis.client.get(key);
  }

  async set(key: string, value: string, ttlSec: number): Promise<void> {
    await this.redis.client.set(key, value, 'EX', ttlSec);
  }

  async acquireLock(key: string, ttlSec: number): Promise<string | null> {
    const token = randomUUID();
    const result = await this.redis.client.set(key, token, 'EX', ttlSec, 'NX');
    return result === 'OK' ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const current = await this.redis.client.get(key);
    if (current === token) await this.redis.client.del(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.client.del(key);
  }
}
