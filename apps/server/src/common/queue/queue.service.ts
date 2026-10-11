import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Job, JobsOptions, Queue, QueueOptions, Worker } from 'bullmq';
import type { CronJobDefinition } from './cron-job.decorator';
import { buildDefaultJobOptions } from './default-job-options';
import { QueueConnection } from './queue.connection';
import { CRON_SCHEDULER_PREFIX, DEFAULT_QUEUE_NAME, DEFAULT_TIMEZONE } from './queue.constants';
import { QUEUE_FAILED_EVENT, type QueueFailedPayload } from './queue.events';
import { BullQueueBackendFactory } from './queue-backend';
import type { ProcessorRegistration } from './queue-processor.decorator';

/**
 * 队列的生产者与消费者入口：投递任务、注册定时任务、按队列创建 worker。
 *
 * - 队列实例与 worker 都**懒创建**，测试无需 Redis；
 * - worker 只在 `APP_ROLE=worker` 时由 QueueJobsBootstrap 创建（§13.2）。
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers: Worker[] = [];
  private readonly scheduled: string[] = [];

  constructor(
    private readonly backend: BullQueueBackendFactory,
    private readonly connection: QueueConnection,
    private readonly events: EventEmitter2,
  ) {}

  /** 取得（首次访问时创建并复用）某个队列的生产者 */
  getQueue(name: string = DEFAULT_QUEUE_NAME): Queue {
    const existing = this.queues.get(name);
    if (existing) return existing;
    const options: QueueOptions = {
      connection: this.connection.client as unknown as QueueOptions['connection'],
      prefix: this.connection.prefix,
      defaultJobOptions: buildDefaultJobOptions(),
    };
    const queue = this.backend.createQueue(name, options);
    this.queues.set(name, queue);
    return queue;
  }

  /** 投递一个任务（默认重试 3 次指数退避） */
  async enqueue<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job> {
    return this.getQueue(queueName).add(jobName, data, buildDefaultJobOptions(options));
  }

  /**
   * 注册一个定时任务（BullMQ Job Scheduler）。同一 scheduler id 幂等 upsert：
   * 多实例启动不会重复注册；修改 cron 表达式后下次启动自动覆盖。
   */
  async scheduleCron(def: CronJobDefinition): Promise<void> {
    const { options } = def;
    const queue = this.getQueue(options.queue);
    const tz = options.tz ?? this.connection.timezone ?? DEFAULT_TIMEZONE;
    const schedulerId = `${CRON_SCHEDULER_PREFIX}:${options.name}`;
    await queue.upsertJobScheduler(
      schedulerId,
      { pattern: options.pattern, tz },
      { name: options.name, data: options.data, opts: buildDefaultJobOptions(options.options) },
    );
    this.scheduled.push(options.name);
    this.logger.log(
      `已注册定时任务 ${options.name}（${options.pattern} @ ${tz}，队列 ${options.queue}）`,
    );
  }

  /** 为某个队列创建 worker（只在 worker 进程中调用） */
  createWorker(name: string, processor: (job: Job) => Promise<unknown>): Worker {
    const worker = this.backend.createWorker(name, processor, {
      connection: this.connection.client as unknown as QueueOptions['connection'],
      prefix: this.connection.prefix,
      concurrency: this.connection.concurrency,
    });
    worker.on('failed', (job, error) => this.onJobFailed(name, job, error));
    worker.on('error', (error) => this.logger.error(`队列 ${name} worker 错误：${error.message}`));
    this.workers.push(worker);
    this.logger.log(`已为队列 ${name} 创建 worker（并发 ${this.connection.concurrency}）`);
    return worker;
  }

  /** 从 @QueueProcessor 注册信息创建 worker */
  createWorkerFor(registration: ProcessorRegistration): Worker {
    return this.createWorker(registration.queue, registration.process);
  }

  /** 已注册的队列 / 定时任务 / 处理器摘要（启动日志用） */
  describe(): { queues: string[]; cronJobs: string[]; workers: number } {
    return {
      queues: [...this.queues.keys()],
      cronJobs: [...this.scheduled],
      workers: this.workers.length,
    };
  }

  /** 任务最终失败（重试耗尽）才发布 queue.failed，避免误告警 */
  private onJobFailed(queue: string, job: Job | undefined, error: Error): void {
    const attempts = job?.opts?.attempts ?? 1;
    const attemptsMade = job?.attemptsMade ?? 0;
    if (attemptsMade < attempts) return;
    const payload: QueueFailedPayload = {
      queue,
      jobName: job?.name ?? 'unknown',
      jobId: job?.id,
      attemptsMade,
      error: error.message,
    };
    this.logger.error(`任务最终失败 ${queue}/${payload.jobName}：${error.message}`);
    this.events.emit(QUEUE_FAILED_EVENT, payload);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([...this.queues.values()].map((queue) => queue.close()));
    await Promise.allSettled(this.workers.map((worker) => worker.close()));
    this.queues.clear();
    this.workers.length = 0;
    this.scheduled.length = 0;
  }
}
