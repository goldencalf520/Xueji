import { describe, expect, it, vi } from 'vitest';
import { MemoryTokenStore } from './testing/memory-token-store';
import {
  WechatAccessTokenProvider,
  type WechatAccessTokenProviderOptions,
  type WechatAccessTokenResponse,
} from './wechat.access-token';

const CACHE_KEY = 'xueji:wechat:access_token:wx-test';
const LOCK_KEY = 'xueji:wechat:access_token:lock:wx-test';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function createProvider(
  store: MemoryTokenStore,
  fetchToken: () => Promise<WechatAccessTokenResponse>,
  overrides: Partial<WechatAccessTokenProviderOptions> = {},
) {
  return new WechatAccessTokenProvider({
    store,
    fetchToken,
    cacheKey: CACHE_KEY,
    lockKey: LOCK_KEY,
    waitIntervalMs: 2,
    waitTimeoutMs: 200,
    ...overrides,
  });
}

describe('wechat.access-token', () => {
  it('缓存命中时直接返回，不请求微信', async () => {
    const store = new MemoryTokenStore();
    store.seed(CACHE_KEY, 'tk-cached');
    const fetchToken = vi.fn<() => Promise<WechatAccessTokenResponse>>();

    const token = await createProvider(store, fetchToken).getToken();

    expect(token).toBe('tk-cached');
    expect(fetchToken).not.toHaveBeenCalled();
  });

  it('缓存为空时请求一次并写入缓存，TTL = expires_in − 提前刷新窗口', async () => {
    const store = new MemoryTokenStore();
    const fetchToken = vi.fn(async () => ({ accessToken: 'tk-new', expiresIn: 7200 }));

    const token = await createProvider(store, fetchToken).getToken();

    expect(token).toBe('tk-new');
    expect(fetchToken).toHaveBeenCalledTimes(1);
    expect(store.writtenTtl).toEqual([{ key: CACHE_KEY, ttlSec: 6900 }]);
    expect(await store.get(CACHE_KEY)).toBe('tk-new');
  });

  it('有效期很短时 TTL 不低于下限，避免频繁刷新刷爆配额', async () => {
    const store = new MemoryTokenStore();
    const fetchToken = vi.fn(async () => ({ accessToken: 'tk-short', expiresIn: 120 }));

    await createProvider(store, fetchToken).getToken();

    // 120 - 300 < 60 → 取 60
    expect(store.writtenTtl).toEqual([{ key: CACHE_KEY, ttlSec: 60 }]);
  });

  it('缓存里的旧令牌被视为未命中（TTL 到期）后重新请求', async () => {
    const store = new MemoryTokenStore();
    store.seed(CACHE_KEY, 'tk-expired', 0);
    const fetchToken = vi.fn(async () => ({ accessToken: 'tk-fresh', expiresIn: 7200 }));

    const token = await createProvider(store, fetchToken).getToken();

    expect(token).toBe('tk-fresh');
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('并发获取时只向微信请求一次（先到的持锁，后到的等缓存）', async () => {
    const store = new MemoryTokenStore();
    let resolveFetch: ((value: WechatAccessTokenResponse) => void) | undefined;
    const fetchToken = vi.fn(
      () =>
        new Promise<WechatAccessTokenResponse>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const providerA = createProvider(store, fetchToken);
    const providerB = createProvider(store, fetchToken);

    const promiseA = providerA.getToken();
    await sleep(5);
    expect(store.isLocked(LOCK_KEY)).toBe(true);
    const promiseB = providerB.getToken();
    await sleep(10);
    resolveFetch?.({ accessToken: 'tk-once', expiresIn: 7200 });

    expect(await promiseA).toBe('tk-once');
    expect(await promiseB).toBe('tk-once');
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('抢不到锁但持锁者回填了缓存时，直接使用缓存值且不重复请求', async () => {
    const store = new MemoryTokenStore();
    const fetchToken = vi.fn<() => Promise<WechatAccessTokenResponse>>();
    // 模拟另一个进程已持锁
    expect(await store.acquireLock(LOCK_KEY, 10)).not.toBeNull();

    const promise = createProvider(store, fetchToken).getToken();
    await sleep(10);
    store.seed(CACHE_KEY, 'tk-from-other-instance');

    await expect(promise).resolves.toBe('tk-from-other-instance');
    expect(fetchToken).not.toHaveBeenCalled();
    expect(store.releaseCount).toBe(0); // 没拿到锁的进程不应释放别人的锁
  });

  it('抢不到锁且等不到缓存回填时，自己取一次（宁可多取，不让请求失败）', async () => {
    const store = new MemoryTokenStore();
    expect(await store.acquireLock(LOCK_KEY, 10)).not.toBeNull();
    const fetchToken = vi.fn(async () => ({ accessToken: 'tk-fallback', expiresIn: 7200 }));

    const token = await createProvider(store, fetchToken, {
      waitTimeoutMs: 20,
      waitIntervalMs: 2,
    }).getToken();

    expect(token).toBe('tk-fallback');
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('refreshToken 强制丢弃缓存并重新请求（令牌失效重试路径）', async () => {
    const store = new MemoryTokenStore();
    store.seed(CACHE_KEY, 'tk-stale');
    const fetchToken = vi.fn(async () => ({ accessToken: 'tk-renewed', expiresIn: 7200 }));
    const provider = createProvider(store, fetchToken);

    const token = await provider.refreshToken();

    expect(token).toBe('tk-renewed');
    expect(fetchToken).toHaveBeenCalledTimes(1);
    expect(await store.get(CACHE_KEY)).toBe('tk-renewed');
  });

  it('正常路径结束后释放锁', async () => {
    const store = new MemoryTokenStore();
    const fetchToken = vi.fn(async () => ({ accessToken: 'tk', expiresIn: 7200 }));

    await createProvider(store, fetchToken).getToken();

    expect(store.isLocked(LOCK_KEY)).toBe(false);
    expect(store.releaseCount).toBe(1);
  });

  it('请求微信失败时不写缓存并向上抛出；下一次调用会再试', async () => {
    const store = new MemoryTokenStore();
    const fetchToken = vi
      .fn<() => Promise<WechatAccessTokenResponse>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ accessToken: 'tk-after-retry', expiresIn: 7200 });
    const provider = createProvider(store, fetchToken);

    await expect(provider.getToken()).rejects.toThrowError('boom');
    expect(store.writtenTtl).toHaveLength(0);
    expect(store.isLocked(LOCK_KEY)).toBe(false);

    await expect(provider.getToken()).resolves.toBe('tk-after-retry');
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });

  it('日志只记录语义信息，不打印令牌本身', async () => {
    const store = new MemoryTokenStore();
    const messages: string[] = [];
    const logger = {
      debug: (message: string) => {
        messages.push(message);
      },
      warn: (message: string) => {
        messages.push(message);
      },
    };
    const fetchToken = vi.fn(async () => ({ accessToken: 'tk-secret-value', expiresIn: 7200 }));

    await createProvider(store, fetchToken, { logger }).getToken();

    expect(messages.join('\n')).toContain('access_token 缓存未命中');
    expect(messages.join('\n')).not.toContain('tk-secret-value');
  });
});
