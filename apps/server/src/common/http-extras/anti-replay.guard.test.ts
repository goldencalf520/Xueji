import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@xueji/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BizException } from '../errors/biz.exception';
import { AntiReplay } from './anti-replay.decorator';
import { AntiReplayGuard } from './anti-replay.guard';
import { FakeRedis, fakeRedisService } from './testing/fake-redis';
import { mockContext } from './testing/mock-context';

const T0 = 1_700_000_000_000;

class Probe {
  @AntiReplay()
  protected() {}
  plain() {}
}

function makeGuard() {
  const fake = new FakeRedis();
  const guard = new AntiReplayGuard(new Reflector(), fakeRedisService(fake));
  return { guard, fake };
}

function ctx(headers: Record<string, string>) {
  return mockContext(Probe.prototype.protected, Probe, { headers });
}

async function rejectWith(guard: AntiReplayGuard, headers: Record<string, string>) {
  try {
    await guard.canActivate(ctx(headers));
    expect.unreachable('应当被拒绝');
  } catch (e) {
    expect(e).toBeInstanceOf(BizException);
    return e as BizException;
  }
}

describe('AntiReplayGuard', () => {
  let guard: AntiReplayGuard;
  let fake: FakeRedis;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    ({ guard, fake } = makeGuard());
  });

  it('未标注 @AntiReplay() 的路由直接放行', async () => {
    await expect(guard.canActivate(mockContext(Probe.prototype.plain, Probe))).resolves.toBe(true);
    expect(fake.keys).toHaveLength(0);
  });

  it('合法时间戳 + 首次 nonce：放行并记录 nonce', async () => {
    await expect(
      guard.canActivate(ctx({ 'X-Timestamp': String(T0), 'X-Nonce': 'n-12345678' })),
    ).resolves.toBe(true);
    expect(fake.keys).toContain('xueji:nonce:app:n-12345678');
  });

  it('缺少时间戳或 nonce → 40020', async () => {
    const e1 = await rejectWith(guard, { 'X-Nonce': 'n-12345678' });
    expect(e1.code).toBe(ErrorCode.INVALID_PARAMS);
    const e2 = await rejectWith(guard, { 'X-Timestamp': String(T0) });
    expect(e2.code).toBe(ErrorCode.INVALID_PARAMS);
  });

  it('时间戳过期（超过 ±5 分钟）→ 40020：过去与未来两个方向都要拦截', async () => {
    const past = await rejectWith(guard, {
      'X-Timestamp': String(T0 - 5 * 60_000 - 1),
      'X-Nonce': 'n-11111111',
    });
    expect(past.code).toBe(ErrorCode.INVALID_PARAMS);
    const future = await rejectWith(guard, {
      'X-Timestamp': String(T0 + 5 * 60_000 + 1),
      'X-Nonce': 'n-22222222',
    });
    expect(future.code).toBe(ErrorCode.INVALID_PARAMS);
  });

  it('±5 分钟边界内（含毫秒级与秒级时间戳）放行', async () => {
    await expect(
      guard.canActivate(ctx({ 'X-Timestamp': String(T0 - 5 * 60_000), 'X-Nonce': 'n-33333331' })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(ctx({ 'X-Timestamp': String(T0 + 5 * 60_000), 'X-Nonce': 'n-33333332' })),
    ).resolves.toBe(true);
    const seconds = Math.floor(T0 / 1000); // 秒级时间戳自动换算
    await expect(
      guard.canActivate(ctx({ 'X-Timestamp': String(seconds), 'X-Nonce': 'n-33333333' })),
    ).resolves.toBe(true);
  });

  it('nonce 重复 → 40900（重放拦截）', async () => {
    const headers = { 'X-Timestamp': String(T0), 'X-Nonce': 'n-44444444' };
    await expect(guard.canActivate(ctx(headers))).resolves.toBe(true);
    const dup = await rejectWith(guard, { ...headers, 'X-Timestamp': String(T0 + 60_000) });
    expect(dup.code).toBe(ErrorCode.CONFLICT);
  });

  it('非法时间戳 / 非法 nonce 格式 → 40020', async () => {
    const badTs = await rejectWith(guard, {
      'X-Timestamp': 'not-a-number',
      'X-Nonce': 'n-55555551',
    });
    expect(badTs.code).toBe(ErrorCode.INVALID_PARAMS);
    const badTs2 = await rejectWith(guard, { 'X-Timestamp': '-123', 'X-Nonce': 'n-55555552' });
    expect(badTs2.code).toBe(ErrorCode.INVALID_PARAMS);
    const badNonce = await rejectWith(guard, { 'X-Timestamp': String(T0), 'X-Nonce': '短' });
    expect(badNonce.code).toBe(ErrorCode.INVALID_PARAMS);
  });

  it('nonce 10 分钟后可复用（TTL 到期）', async () => {
    const headers = { 'X-Timestamp': String(T0), 'X-Nonce': 'n-66666666' };
    await expect(guard.canActivate(ctx(headers))).resolves.toBe(true);
    vi.setSystemTime(T0 + 10 * 60_000 + 1);
    await expect(
      guard.canActivate(ctx({ 'X-Timestamp': String(T0 + 10 * 60_001), 'X-Nonce': 'n-66666666' })),
    ).resolves.toBe(true);
  });
});
