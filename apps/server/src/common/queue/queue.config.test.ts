import { describe, expect, it } from 'vitest';
import { loadQueueEnv, QueueConfig } from './queue.config';

const env = (values: Record<string, string>): NodeJS.ProcessEnv => values as NodeJS.ProcessEnv;

describe('loadQueueEnv', () => {
  it('缺省时使用合理默认值', () => {
    const parsed = loadQueueEnv(env({}));
    expect(parsed.REDIS_URL).toBe('redis://localhost:6379');
    expect(parsed.QUEUE_PREFIX).toBe('xueji');
    expect(parsed.QUEUE_CONCURRENCY).toBe(4);
    expect(parsed.QUEUE_TZ).toBe('Asia/Shanghai');
    expect(parsed.APP_ROLE).toBe('api');
  });

  it('读取并转换显式配置', () => {
    const parsed = loadQueueEnv(
      env({ APP_ROLE: 'worker', QUEUE_CONCURRENCY: '8', QUEUE_PREFIX: 'xueji-test' }),
    );
    expect(parsed.APP_ROLE).toBe('worker');
    expect(parsed.QUEUE_CONCURRENCY).toBe(8);
    expect(parsed.QUEUE_PREFIX).toBe('xueji-test');
  });

  it('非法并发数直接报错（不静默降级）', () => {
    expect(() => loadQueueEnv(env({ QUEUE_CONCURRENCY: '0' }))).toThrow(/队列环境变量校验失败/);
  });

  it('非法 APP_ROLE 报错', () => {
    expect(() => loadQueueEnv(env({ APP_ROLE: 'scheduler' }))).toThrow(/队列环境变量校验失败/);
  });
});

describe('QueueConfig', () => {
  it('把校验后的配置暴露为只读访问器', () => {
    const config = new QueueConfig(loadQueueEnv(env({ APP_ROLE: 'worker', QUEUE_TZ: 'UTC' })));
    expect(config.appRole).toBe('worker');
    expect(config.redisUrl).toBe('redis://localhost:6379');
    expect(config.prefix).toBe('xueji');
    expect(config.concurrency).toBe(4);
    expect(config.timezone).toBe('UTC');
  });
});
