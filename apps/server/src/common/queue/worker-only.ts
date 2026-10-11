/**
 * 处理器只在 worker 进程注册（§13.2、§13.5）：api 进程只负责投递任务，不消费队列。
 *
 * 用法：
 *   providers: [...workerOnly([ConsumptionImportProcessor])]
 *
 * `role` 可显式传入，便于测试；默认读 `process.env.APP_ROLE`（缺省视为 api）。
 */
export function workerOnly<T>(
  providers: readonly T[],
  role: string | undefined = process.env.APP_ROLE,
): T[] {
  return role === 'worker' ? [...providers] : [];
}
