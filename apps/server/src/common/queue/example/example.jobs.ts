import type { Job } from 'bullmq';
import { CronJob } from '../cron-job.decorator';
import { QueueProcessor } from '../queue-processor.decorator';

export const EXAMPLE_QUEUE = 'example';
export const EXAMPLE_HEARTBEAT_JOB = 'example.heartbeat';

/**
 * 示例处理器 + 定时任务（**模板**，供业务模块照抄，本身不会被自动装配）。
 *
 * 业务模块在自己的 `providers` 里用 `workerOnly([ExampleJobs])` 注册即可 —— 处理器只在 worker
 * 进程实例化，队列框架启动时通过 `@QueueProcessor` / `@CronJob` 自动发现（见 ../README.md）。
 */
@QueueProcessor({ queue: EXAMPLE_QUEUE })
export class ExampleJobs {
  /** worker 消费入口：按 job name 分发 */
  async process(job: Job): Promise<unknown> {
    if (job.name === EXAMPLE_HEARTBEAT_JOB) return this.collectHeartbeat();
    return undefined;
  }

  /** 每 5 分钟执行一次（Asia/Shanghai） */
  @CronJob({ name: EXAMPLE_HEARTBEAT_JOB, pattern: '*/5 * * * *', queue: EXAMPLE_QUEUE })
  async collectHeartbeat(): Promise<{ at: string }> {
    return { at: new Date().toISOString() };
  }
}
