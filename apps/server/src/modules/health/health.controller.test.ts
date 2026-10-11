import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../bootstrap';
import { CommonModule } from '../../common/common.module';
import { HealthModule } from './health.module';

describe('GET /api/v1/health', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule, HealthModule],
    }).compile();
    app = await createApp(moduleRef.createNestApplication(), { openapi: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('返回统一响应信封', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('未知路由返回 40400', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);
    expect(res.body.code).toBe(40400);
  });
});
