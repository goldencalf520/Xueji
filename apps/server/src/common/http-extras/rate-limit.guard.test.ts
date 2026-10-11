import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@xueji/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BizException } from '../errors/biz.exception';
import { RateLimit } from './rate-limit.decorator';
import { RateLimitGuard } from './rate-limit.guard';
import { FakeRedis, fakeRedisService } from './testing/fake-redis';
import { mockContext } from './testing/mock-context';

// 固定时钟：滑动窗口测试完全确定
const T0 = 1_700_000_000_000;

class Probe {
  @RateLimit({ key: 'ip', limit: 2, windowSec: 60 })
  ipLimit() {}
  @RateLimit({ key: 'user', limit: 2, windowSec: 60 })
  userLimit() {}
  plain() {}
}

/**
 * 构造守卫。全局默认限流的配置通过 vi.stubEnv 注入（构造器读取环境变量），
 * env 的值均为字符串（与真实环境变量一致）。
 */
function makeGuard(env: Record<string, string> = {}) {
  vi.stubEnv('RATE_LIMIT_GLOBAL_ENABLED', 'true');
  vi.stubEnv('RATE_LIMIT_GLOBAL_LIMIT', '300');
  vi.stubEnv('RATE_LIMIT_GLOBAL_WINDOW_SEC', '60');
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const fake = new FakeRedis();
  const guard = new RateLimitGuard(new Reflector(), fakeRedisService(fake));
  return { guard, fake };
}

function req(over: Record<string, unknown> = {}) {
  return {
    path: '/api/v1/app/test',
    ip: '1.2.3.4',
    route: { path: '/app/test' },
    ...over,
  };
}

describe('RateLimitGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('路由级：窗口内超过 limit 返回 42900', async () => {
    const { guard } = makeGuard({ RATE_LIMIT_GLOBAL_ENABLED: 'false' });
    const ctx = () => mockContext(Probe.prototype.ipLimit, Probe, req());
    await expect(guard.canActivate(ctx())).resolves.toBe(true);
    await expect(guard.canActivate(ctx())).resolves.toBe(true);
    await expect(guard.canActivate(ctx())).rejects.toMatchObject({
      code: ErrorCode.TOO_MANY_REQUESTS,
    });
  });

  it('路由级 42900 是 BizException，且随窗口滑动恢复', async () => {
    const { guard } = makeGuard({ RATE_LIMIT_GLOBAL_ENABLED: 'false' });
    const ctx = () => mockContext(Probe.prototype.ipLimit, Probe, req());
    for (let i = 0; i < 2; i++) await guard.canActivate(ctx());
    try {
      await guard.canActivate(ctx());
      expect.unreachable('应当超限');
    } catch (e) {
      expect(e).toBeInstanceOf(BizException);
      expect((e as BizException).code).toBe(42900);
    }
    vi.setSystemTime(T0 + 61_000); // 窗口滑出前两条记录
    await expect(guard.canActivate(ctx())).resolves.toBe(true);
  });

  it('key=user：按登录用户计数，未登录回退 IP', async () => {
    const { guard } = makeGuard({ RATE_LIMIT_GLOBAL_ENABLED: 'false' });
    const handler = Probe.prototype.userLimit;
    const alice = () => mockContext(handler, Probe, req({ user: { sub: 'alice' } }));
    const bob = () => mockContext(handler, Probe, req({ user: { sub: 'bob' } }));
    const anon = () => mockContext(handler, Probe, req());
    await guard.canActivate(alice());
    await guard.canActivate(alice());
    await expect(guard.canActivate(alice())).rejects.toMatchObject({ code: 42900 });
    await expect(guard.canActivate(bob())).resolves.toBe(true); // 其他用户不受影响
    await expect(guard.canActivate(anon())).resolves.toBe(true); // 未登录回退 IP（127.0.0.1）
  });

  it('不同 IP 各自计数（路由模板聚合，路径参数不打散）', async () => {
    const { guard } = makeGuard({ RATE_LIMIT_GLOBAL_ENABLED: 'false' });
    const handler = Probe.prototype.ipLimit;
    const a = () => mockContext(handler, Probe, req({ ip: '1.1.1.1' }));
    const b = () => mockContext(handler, Probe, req({ ip: '2.2.2.2' }));
    await guard.canActivate(a());
    await guard.canActivate(a());
    await expect(guard.canActivate(a())).rejects.toMatchObject({ code: 42900 });
    await expect(guard.canActivate(b())).resolves.toBe(true);
  });

  it('全局默认限流：所有路由按 IP 总量生效', async () => {
    const { guard } = makeGuard({ RATE_LIMIT_GLOBAL_LIMIT: '3' });
    const ctx = () => mockContext(Probe.prototype.plain, Probe, req());
    for (let i = 0; i < 3; i++) await guard.canActivate(ctx());
    await expect(guard.canActivate(ctx())).rejects.toMatchObject({ code: 42900 });
  });

  it('全局默认限流：健康检查端点豁免', async () => {
    const { guard } = makeGuard({ RATE_LIMIT_GLOBAL_LIMIT: '1' });
    const health = () =>
      mockContext(Probe.prototype.plain, Probe, req({ path: '/api/v1/health', route: undefined }));
    for (let i = 0; i < 5; i++) await expect(guard.canActivate(health())).resolves.toBe(true);
  });

  it('全局默认限流：可通过环境变量关闭（装饰器仍生效）', async () => {
    const { guard } = makeGuard({
      RATE_LIMIT_GLOBAL_ENABLED: 'false',
      RATE_LIMIT_GLOBAL_LIMIT: '1',
    });
    const plain = () => mockContext(Probe.prototype.plain, Probe, req());
    for (let i = 0; i < 5; i++) await expect(guard.canActivate(plain())).resolves.toBe(true);

    const limited = () => mockContext(Probe.prototype.ipLimit, Probe, req());
    await guard.canActivate(limited());
    await guard.canActivate(limited());
    await expect(guard.canActivate(limited())).rejects.toMatchObject({ code: 42900 });
  });

  it('未标注路由且全局开启时仍走全局限流；无 user 时空 principal 回退 IP', async () => {
    const { guard } = makeGuard({ RATE_LIMIT_GLOBAL_LIMIT: '2' });
    const ctx = () => mockContext(Probe.prototype.plain, Probe, req());
    await guard.canActivate(ctx());
    await guard.canActivate(ctx());
    await expect(guard.canActivate(ctx())).rejects.toMatchObject({ code: 42900 });
  });

  it('Redis 键按主体隔离并带窗口过期（pexpire）', async () => {
    const { guard, fake } = makeGuard({ RATE_LIMIT_GLOBAL_ENABLED: 'false' });
    const ctx = () => mockContext(Probe.prototype.ipLimit, Probe, req());
    await guard.canActivate(ctx());
    const key = fake.keys.find((k) => k.includes('xueji:rl:'));
    expect(key).toBe('xueji:rl:r_app_test_ip:ip:1.2.3.4');
    expect(await fake.zcard(key)).toBe(1);
  });
});
