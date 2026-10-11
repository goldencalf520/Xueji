import 'reflect-metadata';
import type { Job } from 'bullmq';
import { DEFAULT_QUEUE_NAME } from './queue.constants';

export interface QueueProcessorOptions {
  /** 队列名；缺省 default */
  queue?: string;
}

/** @QueueProcessor 元数据键（挂在类构造函数上） */
export const QUEUE_PROCESSOR_METADATA = Symbol('xueji:queue:processor');

/** 处理器契约：实现 process 即成为该队列的 worker 处理器 */
export interface JobProcessor {
  process(job: Job): Promise<unknown>;
}

/**
 * 把一个类标记为某个队列的处理器。**只在 worker 进程注册**（由 workerOnly / 队列框架保证），
 * api 进程只投递、不消费。
 */
export function QueueProcessor(options: QueueProcessorOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(
      QUEUE_PROCESSOR_METADATA,
      { queue: options.queue ?? DEFAULT_QUEUE_NAME },
      target,
    );
  };
}

export interface ProcessorRegistration {
  /** 队列名 */
  queue: string;
  /** 已绑定实例的 process 方法 */
  process: (job: Job) => Promise<unknown>;
}

function readProcessorQueue(instance: object): string | undefined {
  const meta = Reflect.getMetadata(QUEUE_PROCESSOR_METADATA, instance.constructor) as
    | QueueProcessorOptions
    | undefined;
  return meta?.queue;
}

/**
 * 从一个 provider 实例上解析出处理器注册信息：类需带 @QueueProcessor 且实现 process 方法。
 * 不符合条件的返回 undefined（用于过滤普通 provider）。
 */
export function collectProcessor(instance: object): ProcessorRegistration | undefined {
  const queue = readProcessorQueue(instance);
  if (!queue) return undefined;
  const process = (instance as Partial<JobProcessor>).process;
  if (typeof process !== 'function') {
    throw new Error(
      `@QueueProcessor 标注的 ${instance.constructor?.name ?? 'class'} 必须实现 process(job) 方法`,
    );
  }
  return { queue, process: process.bind(instance) as (job: Job) => Promise<unknown> };
}

/** 批量解析处理器注册信息 */
export function collectProcessors(providers: readonly object[]): ProcessorRegistration[] {
  return providers
    .map((provider) =>
      provider && typeof provider === 'object' ? collectProcessor(provider) : undefined,
    )
    .filter((reg): reg is ProcessorRegistration => reg !== undefined);
}
