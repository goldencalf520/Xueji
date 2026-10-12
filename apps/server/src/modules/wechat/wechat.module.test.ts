import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RedisModule } from '../../common/redis/redis.module';
import { WechatFakeClient } from './wechat.fake.client';
import { WechatModule } from './wechat.module';
import { WechatClient } from './wechat.types';

/** 模拟「别的模块 import WechatModule 后注入 WechatClient」（backend.md 第 4、9 条） */
@Module({ imports: [WechatModule] })
class ConsumerModule {}

describe('wechat.module', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('WX_APPID 未配置时提供 Fake 实现，且依赖方 import 后能注入到 WechatClient', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('WX_APPID', '');
    vi.stubEnv('WX_SECRET', '');

    const moduleRef = await Test.createTestingModule({
      imports: [RedisModule, ConsumerModule],
    }).compile();

    const client = moduleRef.get(WechatClient);

    expect(client).toBeInstanceOf(WechatFakeClient);
    await moduleRef.close();
  });

  it('配了 WX_APPID 却没给 WX_SECRET 时启动即失败（不静默降级）', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('WX_APPID', 'wx-test-appid');
    vi.stubEnv('WX_SECRET', '');

    await expect(
      Test.createTestingModule({ imports: [RedisModule, ConsumerModule] }).compile(),
    ).rejects.toThrow(/WX_SECRET/);
  });
});
