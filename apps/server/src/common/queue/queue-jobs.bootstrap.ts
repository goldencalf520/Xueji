import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { collectCronJobsFromProviders } from './cron-job.decorator';
import { QueueConfig } from './queue.config';
import { QueueService } from './queue.service';
import { collectProcessors } from './queue-processor.decorator';

/**
 * worker 启动时自动装配队列：扫描容器中所有带 `@QueueProcessor` / `@CronJob` 的 provider，
 * 为它们创建 worker 并把定时任务 upsert 到 BullMQ Job Scheduler。
 *
 * **api 进程直接跳过**（§13.2）：api 只投递任务，不注册任何处理器；业务模块自身用
 * `workerOnly([...])` 让处理器类在 api 进程中根本不进容器，二者叠加保证不会误消费。
 */
@Injectable()
export class QueueJobsBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger('QueueJobs');

  constructor(
    private readonly queues: QueueService,
    private readonly discovery: DiscoveryService,
    private readonly config: QueueConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.appRole !== 'worker') {
      this.logger.log('api 进程：不注册队列处理器与定时任务（只投递）');
      return;
    }
    const instances = this.discovery
      .getProviders()
      .map((wrapper) => wrapper.instance)
      .filter((instance): instance is object => !!instance && typeof instance === 'object');

    const processors = collectProcessors(instances);
    for (const registration of processors) {
      this.queues.createWorkerFor(registration);
    }

    const cronJobs = collectCronJobsFromProviders(instances);
    for (const job of cronJobs) {
      await this.queues.scheduleCron(job);
    }

    const queueNames = [...new Set(processors.map((p) => p.queue))];
    this.logger.log(
      `worker 进程：已注册 ${processors.length} 个处理器、${cronJobs.length} 个定时任务` +
        (queueNames.length ? `（队列：${queueNames.join(', ')}）` : ''),
    );
  }
}
