import 'reflect-metadata';
import { Controller, Get, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../bootstrap';
import { CommonModule } from '../common.module';
import { RedisService } from '../redis/redis.module';
import { AntiReplay } from './anti-replay.decorator';
import { Idempotent } from './idempotent.decorator';
import { RateLimit } from './rate-limit.decorator';
import { FakeRedis } from './testing/fake-redis';

/** 幂等探针：计数器体现业务逻辑执行次数 */
@Controller('test/idem')
class IdemProbeController {
  static created = 0;
  @Post()
  @Idempotent()
  async create() {
    IdemProbeController.created++;
    return { orderNo: `SN-${IdemProbeController.created}` };
  }
}

/** 并发探针：处理中（尚未完成）时第二个同键请求应得到 40900 */
@Controller('test/idem-slow')
class IdemSlowProbeController {
  @Post()
  @Idempotent()
  async create() {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return { ok: true };
  }
}

@Controller('test/rate')
class RateProbeController {
  static hits = 0;
  @Get()
  @RateLimit({ key: 'ip', limit: 2, windowSec: 60 })
  async list() {
    RateProbeController.hits++;
    return { hits: RateProbeController.hits };
  }
}

@Controller('test/replay')
class ReplayProbeController {
  @Post()
  @AntiReplay()
  async act() {
    return { done: true };
  }
}

describe('HttpExtrasModule 全局装配（CommonModule + supertest）', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  const fake = new FakeRedis();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [
        IdemProbeController,
        IdemSlowProbeController,
        RateProbeController,
        ReplayProbeController,
      ],
    })
      .overrideProvider(RedisService)
      .useValue({ client: fake })
      .compile();
    app = await createApp(moduleRef.createNestApplication(), { openapi: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('重复 Idempotency-Key：返回与首次完全一致的响应体，业务逻辑只执行一次（§12.1）', async () => {
    const key = `e2e-idem-${Date.now()}`;
    const first = await request(app.getHttpServer())
      .post('/api/v1/test/idem')
      .set('Idempotency-Key', key)
      .send({ foo: 1 })
      .expect(201);
    expect(first.body.code).toBe(0);
    expect(first.body.data.orderNo).toBe('SN-1');

    const second = await request(app.getHttpServer())
      .post('/api/v1/test/idem')
      .set('Idempotency-Key', key)
      .send({ foo: 1 })
      .expect(201); // 回放与首次响应完全一致（同一路由状态码固定，POST → 201）
    // 业务数据逐字段一致；requestId 是当次请求的（用于追踪本次日志，Stripe 式幂等回放语义）
    expect(second.body.code).toBe(first.body.code);
    expect(second.body.message).toBe(first.body.message);
    expect(second.body.data).toEqual(first.body.data);
    expect(typeof second.body.requestId).toBe('string');
    expect(second.headers['x-idempotent-replay']).toBe('true');
    expect(IdemProbeController.created).toBe(1);
  });

  it('并发的同键请求：处理中的重复得到 40900（不产生重复单据）', async () => {
    const key = `e2e-concurrent-${Date.now()}`;
    const [a, b] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/test/idem-slow')
        .set('Idempotency-Key', key)
        .send({}),
      request(app.getHttpServer())
        .post('/api/v1/test/idem-slow')
        .set('Idempotency-Key', key)
        .send({}),
    ]);
    const codes = [a.body.code, b.body.code].sort();
    expect(codes).toEqual([0, 40900]);
  });

  it('路由级限流：第三次请求 42900 + HTTP 429', async () => {
    const hit = async () => request(app.getHttpServer()).get('/api/v1/test/rate').expect(200);
    expect((await hit()).body.data.hits).toBe(1);
    expect((await hit()).body.data.hits).toBe(2);
    const res = await request(app.getHttpServer()).get('/api/v1/test/rate').expect(429);
    expect(res.body.code).toBe(42900);
  });

  it('防重放：合法放行；同 nonce 重复 40900；缺头 40020；时间戳过期 40020', async () => {
    const post = (headers: Record<string, string>) =>
      request(app.getHttpServer()).post('/api/v1/test/replay').set(headers).send({});
    const now = Date.now();
    const nonce = `e2e-nonce-${now}`;
    const ok = await post({ 'X-Timestamp': String(now), 'X-Nonce': nonce }).expect(201);
    expect(ok.body.code).toBe(0);

    const dup = await post({ 'X-Timestamp': String(now), 'X-Nonce': nonce }).expect(409);
    expect(dup.body.code).toBe(40900);

    const missing = await post({ 'X-Nonce': 'e2e-nonce-miss' }).expect(400);
    expect(missing.body.code).toBe(40020);

    const stale = await post({
      'X-Timestamp': String(now - 10 * 60_000),
      'X-Nonce': `e2e-nonce-stale-${now}`,
    }).expect(400);
    expect(stale.body.code).toBe(40020);
  });

  it('响应信封结构一致：幂等回放没有双重包装', async () => {
    const key = `e2e-envelope-${Date.now()}`;
    const first = await request(app.getHttpServer())
      .post('/api/v1/test/idem')
      .set('Idempotency-Key', key)
      .send({})
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/api/v1/test/idem')
      .set('Idempotency-Key', key)
      .send({})
      .expect(201);
    // 信封恰好一层：回放值由 EnvelopeInterceptor 统一包装，不双重包装
    expect(second.body.code).toBe(0);
    expect(second.body.data).toEqual(first.body.data);
    expect(second.body).toEqual({
      code: 0,
      message: 'ok',
      data: { orderNo: expect.any(String) },
      requestId: expect.any(String),
    });
  });
});
