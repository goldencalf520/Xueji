import { z } from 'zod';
import { DEFAULT_TIMEZONE } from './queue.constants';

/**
 * 队列与定时任务的配置（SRV-08）。变量名统一登记在仓库根 `.env.example`。
 * `REDIS_URL` 在核心配置里已有，这里复用；其余为队列专用（见 `.env.example` 的队列分组）。
 */
export const QueueEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  /** api：只投递；worker：注册处理器与定时任务（§13.2） */
  APP_ROLE: z.enum(['api', 'worker']).default('api'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  /** 队列键名前缀：多环境共用一套 Redis 时用于隔离 */
  QUEUE_PREFIX: z.string().min(1).default('xueji'),
  /** 每个队列的并发处理数 */
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(4),
  /** 定时任务时区 */
  QUEUE_TZ: z.string().min(1).default(DEFAULT_TIMEZONE),
});
export type QueueEnv = z.infer<typeof QueueEnv>;

export function loadQueueEnv(source: NodeJS.ProcessEnv = process.env): QueueEnv {
  const parsed = QueueEnv.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`队列环境变量校验失败：\n${issues}`);
  }
  return parsed.data;
}

/**
 * 队列配置的 DI 载体。用**类 token** 注入（而不是 Symbol + `@Inject`），这样业务代码里不需要
 * 参数装饰器。由 QueueModule 用 `useFactory: () => new QueueConfig(loadQueueEnv())` 提供。
 */
export class QueueConfig {
  constructor(readonly env: QueueEnv) {}

  get appRole(): QueueEnv['APP_ROLE'] {
    return this.env.APP_ROLE;
  }

  get redisUrl(): string {
    return this.env.REDIS_URL;
  }

  get prefix(): string {
    return this.env.QUEUE_PREFIX;
  }

  get concurrency(): number {
    return this.env.QUEUE_CONCURRENCY;
  }

  get timezone(): string {
    return this.env.QUEUE_TZ;
  }
}
