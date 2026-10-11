/**
 * worker 中任务最终失败（重试耗尽）后发布的领域事件（§13.5）。
 * 可观测性 issue 订阅后推送告警，业务模块也可订阅做补偿。
 */
export const QUEUE_FAILED_EVENT = 'queue.failed';

export interface QueueFailedPayload {
  queue: string;
  jobName: string;
  jobId: string | undefined;
  attemptsMade: number;
  error: string;
}
