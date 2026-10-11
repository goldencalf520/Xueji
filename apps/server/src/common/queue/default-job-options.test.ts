import { describe, expect, it } from 'vitest';
import { buildDefaultJobOptions } from './default-job-options';
import { DEFAULT_BACKOFF_DELAY_MS, DEFAULT_JOB_ATTEMPTS } from './queue.constants';

describe('buildDefaultJobOptions', () => {
  it('默认重试 3 次 + 指数退避 + 完成 / 失败保留策略', () => {
    const options = buildDefaultJobOptions();
    expect(options.attempts).toBe(DEFAULT_JOB_ATTEMPTS);
    expect(options.backoff).toEqual({ type: 'exponential', delay: DEFAULT_BACKOFF_DELAY_MS });
    expect(options.removeOnComplete).toEqual({ count: 1000 });
    expect(options.removeOnFail).toEqual({ count: 5000 });
  });

  it('允许按任务覆盖（幂等 jobId、延迟、重试次数）', () => {
    const options = buildDefaultJobOptions({ jobId: 'import:42', delay: 1000, attempts: 1 });
    expect(options.jobId).toBe('import:42');
    expect(options.delay).toBe(1000);
    expect(options.attempts).toBe(1);
    // 未覆盖的字段仍保留默认值
    expect(options.backoff).toEqual({ type: 'exponential', delay: DEFAULT_BACKOFF_DELAY_MS });
  });
});
