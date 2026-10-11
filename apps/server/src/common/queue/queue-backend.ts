import { Injectable } from '@nestjs/common';
import { type Job, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq';

/**
 * 队列后端工厂：把 BullMQ 的构造收敛到一处，业务代码只依赖 QueueService。
 *
 * 抽象成类（而不是裸 bullmq 调用）是为了让单元测试注入假实现（无需真实 Redis）。
 * 注意：注入时用**类 token**（`BullQueueBackendFactory`），测试通过 override 同一个 token 替换。
 */
@Injectable()
export class BullQueueBackendFactory {
  createQueue(name: string, options: QueueOptions): Queue {
    return new Queue(name, options);
  }

  createWorker(
    name: string,
    processor: (job: Job) => Promise<unknown>,
    options: WorkerOptions,
  ): Worker {
    return new Worker(name, processor, options);
  }
}
