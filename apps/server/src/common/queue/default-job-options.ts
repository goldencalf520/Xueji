import type { JobsOptions } from 'bullmq';
import {
  DEFAULT_BACKOFF_DELAY_MS,
  DEFAULT_JOB_ATTEMPTS,
  DEFAULT_KEEP_COMPLETED,
  DEFAULT_KEEP_FAILED,
} from './queue.constants';

/**
 * 统一的默认任务选项：重试 3 次 + 指数退避，完成 / 失败任务按条数保留。
 * 调用方可用 `overrides` 覆盖任意字段（如 `jobId`、`delay`、`attempts`）。
 */
export function buildDefaultJobOptions(overrides: JobsOptions = {}): JobsOptions {
  return {
    attempts: DEFAULT_JOB_ATTEMPTS,
    backoff: { type: 'exponential', delay: DEFAULT_BACKOFF_DELAY_MS },
    removeOnComplete: { count: DEFAULT_KEEP_COMPLETED },
    removeOnFail: { count: DEFAULT_KEEP_FAILED },
    ...overrides,
  };
}
