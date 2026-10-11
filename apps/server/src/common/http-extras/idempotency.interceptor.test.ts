import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { ErrorCode, IDEMPOTENCY_HEADER } from '@xueji/shared';
import { lastValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BizException } from '../errors/biz.exception';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { Idempotent } from './idempotent.decorator';
import { FakeRedis, fakeRedisService } from './testing/fake-redis';
import { mockContext } from './testing/mock-context';

const T0 = 1_700_000_000_000;

class Probe {
  @Idempotent()
  create() {}
  plain() {}
}

function makeInterceptor() {
  const fake = new FakeRedis();
  const interceptor = new IdempotencyInterceptor(new Reflector(), fakeRedisService(fake));
  return { interceptor, fake };
}

/** CallHandler 形状：handle() 返回业务响应流 */
const next = (value: unknown) => ({ handle: () => of(value) });
const nextError = (err: unknown) => ({ handle: () => throwError(() => err) });

function ctx(headers: Record<string, string>, handler = Probe.prototype.create) {
  const res = { setHeader: vi.fn() };
  return { context: mockContext(handler, Probe, { headers }, res), res };
}

describe('IdempotencyInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  it('未标注 @Idempotent() 的路由直接透传', async () => {
    const { interceptor, fake } = makeInterceptor();
    const { context } = ctx({ [IDEMPOTENCY_HEADER]: 'k1' }, Probe.prototype.plain);
    const out = await lastValueFrom(await interceptor.intercept(context, next('原始响应')));
    expect(out).toBe('原始响应');
    expect(fake.keys).toHaveLength(0);
  });

  it('标注但未携带 Idempotency-Key 的请求按普通请求处理', async () => {
    const { interceptor, fake } = makeInterceptor();
    const { context } = ctx({});
    const out = await lastValueFrom(await interceptor.intercept(context, next('响应A')));
    expect(out).toBe('响应A');
    expect(fake.keys).toHaveLength(0);
  });

  it('首次请求：占位 → 处理 → 缓存 24 小时', async () => {
    const { interceptor, fake } = makeInterceptor();
    const { context } = ctx({ [IDEMPOTENCY_HEADER]: 'order-1' });
    const out = await lastValueFrom(
      await interceptor.intercept(context, next({ code: 0, message: 'ok', data: { id: '1' } })),
    );
    expect(out).toEqual({ code: 0, message: 'ok', data: { id: '1' } });
    const key = fake.keys[0];
    expect(key).toBe('xueji:idem:app:ip:127.0.0.1:order-1');
    const raw = await fake.get(key);
    expect(JSON.parse(raw ?? '{}').status).toBe('done');
    // 24 小时 TTL：到期前仍在，到期后可被新请求重新占用
    vi.setSystemTime(T0 + 24 * 60 * 60 * 1000 - 1);
    expect(await fake.get(key)).not.toBeNull();
    vi.setSystemTime(T0 + 24 * 60 * 60 * 1000);
    expect(await fake.get(key)).toBeNull();
  });

  it('重复请求：业务逻辑不执行，返回与首次完全相同的响应体', async () => {
    const { interceptor } = makeInterceptor();
    const { context: c1 } = ctx({ [IDEMPOTENCY_HEADER]: 'order-2' });
    const first = await lastValueFrom(
      await interceptor.intercept(
        c1,
        next({ code: 0, message: 'ok', data: { n: 1 }, requestId: 'req-1' }),
      ),
    );
    const { context: c2, res } = ctx({ [IDEMPOTENCY_HEADER]: 'order-2' });
    const second = await lastValueFrom(
      await interceptor.intercept(
        c2,
        next({ code: 0, message: 'ok', data: { n: 2 }, requestId: 'req-2' }),
      ),
    );
    expect(second).toEqual(first); // 逐字段一致（含首次的 requestId）
    expect((second as { data: { n: number } }).data.n).toBe(1);
    expect(res.setHeader).toHaveBeenCalledWith('X-Idempotent-Replay', 'true');
  });

  it('并发重复（占位键仍是 processing）→ 40900', async () => {
    const { interceptor } = makeInterceptor();
    const { context } = ctx({ [IDEMPOTENCY_HEADER]: 'order-3' });
    // 第一个请求发起但尚未订阅完成时，同键的第二个请求应得到冲突
    const first = interceptor.intercept(context, next('第一次的响应'));
    try {
      await lastValueFrom(await interceptor.intercept(context, next('重复的响应')));
      expect.unreachable('应当返回冲突');
    } catch (e) {
      expect(e).toBeInstanceOf(BizException);
      expect((e as BizException).code).toBe(ErrorCode.CONFLICT);
    }
    await lastValueFrom(await first);
  });

  it('业务失败释放幂等键：同键可重试', async () => {
    const { interceptor, fake } = makeInterceptor();
    const { context } = ctx({ [IDEMPOTENCY_HEADER]: 'order-4' });
    await expect(
      lastValueFrom(
        await interceptor.intercept(
          context,
          nextError(new BizException(ErrorCode.INVALID_PARAMS, '参数错误')),
        ),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.INVALID_PARAMS });
    const key = 'xueji:idem:app:ip:127.0.0.1:order-4';
    expect(await fake.get(key)).toBeNull();
    const out = await lastValueFrom(await interceptor.intercept(context, next('重试成功')));
    expect(out).toBe('重试成功');
  });

  it('幂等键格式不合法 → 40020', async () => {
    const { interceptor, fake } = makeInterceptor();
    for (const key of ['', '含空格 key', 'x'.repeat(129)]) {
      const { context } = ctx({ [IDEMPOTENCY_HEADER]: key });
      try {
        await lastValueFrom(await interceptor.intercept(context, next('不应该到这里')));
        expect.unreachable(`非法键 ${JSON.stringify(key)} 应当被拒绝`);
      } catch (e) {
        expect(e).toBeInstanceOf(BizException);
        expect((e as BizException).code).toBe(ErrorCode.INVALID_PARAMS);
      }
    }
    expect(fake.keys).toHaveLength(0);
  });

  it('登录用户与未登录用户的键空间隔离；不同 aud 隔离', async () => {
    const { interceptor, fake } = makeInterceptor();
    await lastValueFrom(
      await interceptor.intercept(
        mockContext(Probe.prototype.create, Probe, {
          headers: { [IDEMPOTENCY_HEADER]: 'same' },
          user: { sub: '42' },
        }),
        next('u42'),
      ),
    );
    await lastValueFrom(
      await interceptor.intercept(
        mockContext(Probe.prototype.create, Probe, {
          path: '/api/v1/admin/test',
          headers: { [IDEMPOTENCY_HEADER]: 'same' },
        }),
        next('admin-anon'),
      ),
    );
    expect(fake.keys).toContain('xueji:idem:app:u:42:same');
    expect(fake.keys).toContain('xueji:idem:admin:ip:127.0.0.1:same');
  });
});
