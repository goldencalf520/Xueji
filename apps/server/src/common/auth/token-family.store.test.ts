import { describe, expect, it } from 'vitest';
import type { RedisService } from '../redis/redis.module';
import type { Audience, PrincipalClaims } from './principal';
import { FakeRedis } from './testing.redis';
import { TokenFamilyStore } from './token-family.store';

function createStore(): { store: TokenFamilyStore; fake: FakeRedis } {
  const fake = new FakeRedis();
  const store = new TokenFamilyStore({ client: fake } as unknown as RedisService);
  return { store, fake };
}

const CLAIMS: PrincipalClaims = {
  roles: ['advisor'],
  storeIds: ['3'],
  dataScope: 'store',
  staffId: '7',
};

describe('TokenFamilyStore', () => {
  it('create 后 find 返回完整族记录', async () => {
    const { store } = createStore();
    await store.create('fam-1', { aud: 'admin', sub: '7', currentJti: 'j1', claims: CLAIMS }, 3600);
    const record = await store.find('fam-1');
    expect(record).toEqual({ aud: 'admin', sub: '7', currentJti: 'j1', claims: CLAIMS });
  });

  it('不存在的族返回 null', async () => {
    const { store } = createStore();
    expect(await store.find('nope')).toBeNull();
  });

  it('rotate 更新族内有效 jti', async () => {
    const { store } = createStore();
    await store.create('fam-1', { aud: 'app', sub: '1', currentJti: 'j1', claims: CLAIMS }, 3600);
    await store.rotate('fam-1', 'app', '1', 'j2', 3600);
    expect((await store.find('fam-1'))?.currentJti).toBe('j2');
  });

  it('revoke 删除族（find 返回 null）', async () => {
    const { store } = createStore();
    await store.create('fam-1', { aud: 'app', sub: '1', currentJti: 'j1', claims: CLAIMS }, 3600);
    await store.revoke('fam-1', 'app', '1');
    expect(await store.find('fam-1')).toBeNull();
  });

  it('revokeAll 吊销该主体全部族，其它主体不受影响', async () => {
    const { store } = createStore();
    await store.create('fam-1', { aud: 'admin', sub: '7', currentJti: 'j1', claims: CLAIMS }, 3600);
    await store.create('fam-2', { aud: 'admin', sub: '7', currentJti: 'j2', claims: CLAIMS }, 3600);
    await store.create('fam-3', { aud: 'admin', sub: '9', currentJti: 'j3', claims: CLAIMS }, 3600);

    const count = await store.revokeAll('admin', '7');
    expect(count).toBe(2);
    expect(await store.find('fam-1')).toBeNull();
    expect(await store.find('fam-2')).toBeNull();
    expect(await store.find('fam-3')).not.toBeNull();
  });

  it('活动时间：touch 后可读，无记录返回 null', async () => {
    const { store } = createStore();
    const aud: Audience = 'admin';
    expect(await store.lastActivityMs(aud, '7')).toBeNull();

    await store.touchActivity(aud, '7', 1800);
    const ms = await store.lastActivityMs(aud, '7');
    expect(ms).toBeGreaterThan(0);
    expect(Date.now() - (ms ?? 0)).toBeLessThan(5000);
  });

  it('活动时间键到期后返回 null（视为无操作超时）', async () => {
    const { store, fake } = createStore();
    await store.touchActivity('admin', '7', 1800);
    fake.forceExpire('auth:act:admin:7');
    expect(await store.lastActivityMs('admin', '7')).toBeNull();
  });
});
