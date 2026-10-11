import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { loadQueueEnv, QueueConfig } from './queue.config';
import { QueueConnection } from './queue.connection';
import { QueueService } from './queue.service';
import { BullQueueBackendFactory } from './queue-backend';
import { QueueJobsBootstrap } from './queue-jobs.bootstrap';

/**
 * 队列与定时任务框架（SRV-08）。
 *
 * - `QueueService` 投递任务、注册定时任务、创建 worker；队列连接懒创建；
 * - `QueueJobsBootstrap` 在 worker 进程扫描 `@QueueProcessor` / `@CronJob` 并装配，api 进程跳过；
 * - 业务模块只需：给自己的处理器类加 `@QueueProcessor({ queue })`、给定时方法加 `@CronJob({...})`，
 *   并在 `providers` 里用 `workerOnly([...])` 包裹（见 common/queue/README.md）。
 *
 * 本模块已在 CommonModule 预注册，业务模块不需要 import；它本身是 @Global，导出 QueueService。
 * 依赖用**类 token** 注入（QueueConfig / BullQueueBackendFactory），避免参数装饰器。
 */
@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    { provide: QueueConfig, useFactory: () => new QueueConfig(loadQueueEnv()) },
    QueueConnection,
    BullQueueBackendFactory,
    QueueService,
    QueueJobsBootstrap,
  ],
  exports: [QueueService, QueueConnection, BullQueueBackendFactory],
})
export class QueueModule {}
