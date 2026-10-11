import 'reflect-metadata';
import type { JobsOptions } from 'bullmq';
import { DEFAULT_QUEUE_NAME } from './queue.constants';

export interface CronJobOptions {
  /** 任务名，同时作为 job name 与 scheduler id（`cron:<name>`）；建议与 §13.5 清单同名 */
  name: string;
  /** cron 表达式，例如 `0 3 1 * *`（每月 1 日 03:00） */
  pattern: string;
  /** 时区；缺省用 QUEUE_TZ（Asia/Shanghai） */
  tz?: string;
  /** 队列名；缺省 default */
  queue?: string;
  /** 传给处理器的数据 */
  data?: unknown;
  /** 覆盖默认任务选项 */
  options?: JobsOptions;
}

/** @CronJob 元数据键（挂在方法函数上） */
export const CRON_JOB_METADATA = Symbol('xueji:queue:cron-job');

/**
 * 把一个方法标记为定时任务。队列框架在 worker 进程启动时把它 upsert 到 BullMQ Job Scheduler
 * （同一 scheduler id 幂等，多实例不会重复注册）。
 *
 * 「何时跑」由本装饰器决定；「跑什么」仍由该方法实现。业务时间计算一律按 Asia/Shanghai（ADR 0001）。
 */
export function CronJob(options: CronJobOptions): MethodDecorator {
  if (!options.name || !options.pattern) {
    throw new Error('@CronJob 需要 name 与 pattern');
  }
  return (_target, propertyKey, descriptor) => {
    const handler = descriptor.value;
    if (typeof handler !== 'function') {
      throw new Error(`@CronJob 只能标注方法（${String(propertyKey)}）`);
    }
    Reflect.defineMetadata(CRON_JOB_METADATA, { ...options }, handler);
  };
}

export interface CronJobDefinition {
  /** 已补全 queue 的选项 */
  options: CronJobOptions & { queue: string };
  /** 已绑定实例的方法 */
  handler: () => unknown;
}

/** 从实例上收集所有被 @CronJob 标注的方法（含继承链上的原型方法） */
export function collectCronJobs(instance: object): CronJobDefinition[] {
  const defs: CronJobDefinition[] = [];
  const seen = new Set<string>();
  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor' || seen.has(key)) continue;
      // 只读原型上的方法描述符，**不读实例属性**：部分 provider 的实例 getter 有副作用
      // （如 PrismaService.client 会尝试连库），绝不能因为扫描而触发它们。
      const handler = Object.getOwnPropertyDescriptor(proto, key)?.value;
      if (typeof handler !== 'function') continue;
      const meta = Reflect.getMetadata(CRON_JOB_METADATA, handler) as CronJobOptions | undefined;
      if (!meta) continue;
      seen.add(key);
      const fn = handler as (...args: unknown[]) => unknown;
      defs.push({
        options: { ...meta, queue: meta.queue ?? DEFAULT_QUEUE_NAME },
        handler: () => fn.apply(instance, []),
      });
    }
    proto = Object.getPrototypeOf(proto);
  }
  return defs;
}

/** 批量收集多个 provider 上的定时任务 */
export function collectCronJobsFromProviders(providers: readonly object[]): CronJobDefinition[] {
  return providers.flatMap((provider) =>
    provider && typeof provider === 'object' ? collectCronJobs(provider) : [],
  );
}
