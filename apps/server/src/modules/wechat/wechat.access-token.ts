import {
  WECHAT_TOKEN_EARLY_REFRESH_SEC,
  WECHAT_TOKEN_LOCK_TTL_SEC,
  WECHAT_TOKEN_MIN_TTL_SEC,
  WECHAT_TOKEN_WAIT_INTERVAL_MS,
  WECHAT_TOKEN_WAIT_TIMEOUT_MS,
} from './wechat.config';
import type { WechatTokenStore } from './wechat.token-store';

/**
 * 稳定版 access_token 的获取与刷新（SRV-10 / #29）。
 *
 * 策略：
 * 1. 先读缓存（Redis），命中直接返回；
 * 2. 未命中则抢分布式锁（避免多实例同时刷爆微信配额），抢到锁后**双检**缓存再请求微信；
 * 3. 没抢到锁的进程轮询缓存等持锁者回填，超时后自己取一次（宁可多取一次，也不要请求失败）；
 * 4. 缓存 TTL = expires_in - 提前刷新窗口（不低于下限），避免边界上刚好失效。
 *
 * 单进程内也会因为「先读缓存」而自然去重；跨进程靠锁。已取到的令牌在有效期内不会重复刷新。
 */

export interface WechatAccessTokenResponse {
  accessToken: string;
  /** 微信返回的有效期（秒） */
  expiresIn: number;
}

/** 只用到 debug / warn，Nest 的 Logger 可直接传入 */
export interface WechatLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

export interface WechatAccessTokenProviderOptions {
  store: WechatTokenStore;
  /** 向微信请求新令牌；由调用方注入，便于测试 */
  fetchToken: () => Promise<WechatAccessTokenResponse>;
  /** 缓存键，如 `xueji:wechat:access_token:{appid}` */
  cacheKey: string;
  /** 锁键，如 `xueji:wechat:access_token:lock:{appid}` */
  lockKey: string;
  earlyRefreshSec?: number;
  minTtlSec?: number;
  lockTtlSec?: number;
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
  /** 可注入的等待实现（测试里可零耗时） */
  sleep?: (ms: number) => Promise<void>;
  logger?: WechatLogger;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class WechatAccessTokenProvider {
  private readonly store: WechatTokenStore;
  private readonly fetchToken: () => Promise<WechatAccessTokenResponse>;
  private readonly cacheKey: string;
  private readonly lockKey: string;
  private readonly earlyRefreshSec: number;
  private readonly minTtlSec: number;
  private readonly lockTtlSec: number;
  private readonly waitTimeoutMs: number;
  private readonly waitIntervalMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly logger: WechatLogger | undefined;

  constructor(options: WechatAccessTokenProviderOptions) {
    this.store = options.store;
    this.fetchToken = options.fetchToken;
    this.cacheKey = options.cacheKey;
    this.lockKey = options.lockKey;
    this.earlyRefreshSec = options.earlyRefreshSec ?? WECHAT_TOKEN_EARLY_REFRESH_SEC;
    this.minTtlSec = options.minTtlSec ?? WECHAT_TOKEN_MIN_TTL_SEC;
    this.lockTtlSec = options.lockTtlSec ?? WECHAT_TOKEN_LOCK_TTL_SEC;
    this.waitTimeoutMs = options.waitTimeoutMs ?? WECHAT_TOKEN_WAIT_TIMEOUT_MS;
    this.waitIntervalMs = options.waitIntervalMs ?? WECHAT_TOKEN_WAIT_INTERVAL_MS;
    this.sleep = options.sleep ?? defaultSleep;
    this.logger = options.logger;
  }

  /** 取一个可用的 access_token（缓存优先） */
  async getToken(): Promise<string> {
    const cached = await this.store.get(this.cacheKey);
    if (cached) return cached;

    const lockToken = await this.store.acquireLock(this.lockKey, this.lockTtlSec);
    if (lockToken) {
      try {
        // 双检：抢锁期间可能已经有别的进程回填
        const afterLock = await this.store.get(this.cacheKey);
        if (afterLock) return afterLock;
        this.logger?.debug('access_token 缓存未命中，向微信请求新令牌');
        return await this.fetchAndCache();
      } finally {
        await this.store.releaseLock(this.lockKey, lockToken);
      }
    }

    const waited = await this.waitForCache();
    if (waited) return waited;

    // 持锁者一直没回填（可能刚失败）：自己取一次，本进程内不再等
    this.logger?.warn('等待 access_token 回填超时，本进程直接向微信请求');
    return this.fetchAndCache();
  }

  /** 强制刷新：先删缓存再取（用于 errcode 提示令牌失效后的重试） */
  async refreshToken(): Promise<string> {
    await this.store.del(this.cacheKey);
    return this.getToken();
  }

  private async fetchAndCache(): Promise<string> {
    const { accessToken, expiresIn } = await this.fetchToken();
    const ttlSec = Math.max(this.minTtlSec, Math.floor(expiresIn) - this.earlyRefreshSec);
    await this.store.set(this.cacheKey, accessToken, ttlSec);
    return accessToken;
  }

  private async waitForCache(): Promise<string | null> {
    const deadline = Date.now() + this.waitTimeoutMs;
    for (;;) {
      const value = await this.store.get(this.cacheKey);
      if (value) return value;
      if (Date.now() >= deadline) return null;
      await this.sleep(this.waitIntervalMs);
    }
  }
}
