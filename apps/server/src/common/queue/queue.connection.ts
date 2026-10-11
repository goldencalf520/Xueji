import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { QueueConfig } from './queue.config';

/**
 * BullMQ 专用 Redis 连接（与 `common/redis` 的共享连接分开，互不影响）。
 *
 * BullMQ 要求 blocking 连接 `maxRetriesPerRequest: null`。连接**懒创建**：没有 Redis 的单元测试
 * 只要不触发 enqueue / worker 就不会真正连上，模块初始化也不会因 Redis 未启动而失败。
 */
@Injectable()
export class QueueConnection implements OnModuleDestroy {
  private instance?: Redis;

  constructor(private readonly config: QueueConfig) {}

  /** BullMQ 使用的 ioredis 连接（懒创建、复用） */
  get client(): Redis {
    this.instance ??= new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    return this.instance;
  }

  /** 队列键名前缀 */
  get prefix(): string {
    return this.config.prefix;
  }

  /** 每个队列的并发处理数 */
  get concurrency(): number {
    return this.config.concurrency;
  }

  /** 定时任务时区 */
  get timezone(): string {
    return this.config.timezone;
  }

  async onModuleDestroy(): Promise<void> {
    await this.instance?.quit();
  }
}
