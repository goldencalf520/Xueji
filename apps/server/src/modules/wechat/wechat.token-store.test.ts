import { describe, expect, it } from 'vitest';
import { FakeRedis, fakeRedisService } from '../../common/http-extras/testing/fake-redis';
import { RedisWechatTokenStore } from './wechat.token-store';

/**
 * 用 in-memory Redis（common/http-extras 的测试替身）验证生产实现对 Redis 命令的用法：
 * EX/NX 语义、键空间与「只删自己的锁」。TTL 数值的断言在 wechat.access-token.test.ts 里用
 * MemoryTokenStore 覆盖（那边能读到写入的秒数）。
 */

function createStore(fake = new FakeRedis()) {
  return { store: new RedisWechatTokenStore(fakeRedisService(fake)), fake };
}

describe('wechat.token-store（Redis 实现）', () => {
  it('set / get 往返', async () => {
    const { store, fake } = createStore();

    await store.set('xueji:wechat:access_token:wx1', 'tk-1', 7200);

    expect(await store.get('xueji:wechat:access_token:wx1')).toBe('tk-1');
    expect(fake.keys).toContain('xueji:wechat:access_token:wx1');
  });

  it('键不存在时 get 返回 null', async () => {
    const { store } = createStore();

    expect(await store.get('xueji:wechat:access_token:missing')).toBeNull();
  });

  it('锁是互斥的（SET NX）：第一次拿到、第二次拿不到', async () => {
    const { store } = createStore();

    const first = await store.acquireLock('lock:wx1', 10);
    const second = await store.acquireLock('lock:wx1', 10);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('释放锁后可以重新获取', async () => {
    const { store } = createStore();

    const token = await store.acquireLock('lock:wx1', 10);
    await store.releaseLock('lock:wx1', token ?? '');

    expect(await store.acquireLock('lock:wx1', 10)).not.toBeNull();
  });

  it('锁令牌不匹配时不删锁（不会释放别人的锁）', async () => {
    const { store, fake } = createStore();

    const token = await store.acquireLock('lock:wx1', 10);
    await store.releaseLock('lock:wx1', 'someone-elses-token');

    expect(await store.get('lock:wx1')).toBe(token);
    expect(fake.keys).toContain('lock:wx1');
  });

  it('del 清除令牌缓存', async () => {
    const { store } = createStore();
    await store.set('xueji:wechat:access_token:wx1', 'tk-1', 7200);

    await store.del('xueji:wechat:access_token:wx1');

    expect(await store.get('xueji:wechat:access_token:wx1')).toBeNull();
  });

  it('缓存键与锁键互不影响', async () => {
    const { store } = createStore();
    await store.acquireLock('lock:wx1', 10);

    expect(await store.get('lock:wx1')).not.toBeNull();
    expect(await store.get('xueji:wechat:access_token:wx1')).toBeNull();
  });
});
