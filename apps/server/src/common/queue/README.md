# 队列与定时任务框架（SRV-08）

BullMQ（Redis 7）之上的薄封装：统一默认重试、定时任务（Asia/Shanghai）、以及「处理器只在
worker 进程注册」的约定（§13.2、§13.5）。

## 关键约定

- **api 进程只投递，worker 进程才消费**。`QueueJobsBootstrap` 在 `APP_ROLE !== 'worker'` 时直接
  跳过装配；业务模块再用 `workerOnly([...])` 让处理器类在 api 进程根本不进容器，双重保证。
- **连接懒创建**：只有真正 `enqueue` / 建 worker 时才连 Redis，单元测试无需 Redis。
- **定时任务按北京时间触发**：`@CronJob` 的 `tz` 缺省取 `QUEUE_TZ`（`Asia/Shanghai`）。
- **多实例安全**：定时任务用 BullMQ Job Scheduler 的 `upsertJobScheduler`，同一 `cron:<name>`
  幂等 upsert，启动多个 worker 不会重复注册。
- **任务失败可观测**：重试耗尽后发布 `queue.failed` 事件（`queue.events.ts`），供可观测性模块订阅告警。

## 新增一个队列

1. 定义处理器类，加 `@QueueProcessor({ queue })` 并实现 `process(job)`：

```ts
import type { Job } from 'bullmq';
import { QueueProcessor } from '../common/queue/queue-processor.decorator';
import { CronJob } from '../common/queue/cron-job.decorator';

@QueueProcessor({ queue: 'consumption' })
export class ConsumptionImportProcessor {
  async process(job: Job): Promise<void> {
    if (job.name === 'consumption.import') {
      // ... 导入流水
    }
  }

  @CronJob({ name: 'consumption.recheck', pattern: '0 3 * * *', queue: 'consumption' })
  async recheck(): Promise<void> {
    // 每日 03:00（Asia/Shanghai）
  }
}
```

2. 在自己的模块 `providers` 里用 `workerOnly` 注册（api 进程自动为空）：

```ts
@Module({ providers: [...workerOnly([ConsumptionImportProcessor])] })
export class ConsumptionModule {}
```

> 处理器类同时是 `@QueueProcessor` 与 `@CronJob` 的宿主时，队列框架会在 worker 进程
> 为它创建一个 worker，并把它的定时任务 upsert 到 Job Scheduler —— 无需改任何中心文件。

## 从别处投递任务（通常在 api 进程）

```ts
const queues = app.get(QueueService);
await queues.enqueue('consumption', 'consumption.import', { importId }, { jobId: `import:${importId}` });
```

- 默认重试 3 次、指数退避（首次 5s）、完成保留 1000 / 失败保留 5000 条；可用第四个参数覆盖。
- 需要幂等时传 `jobId`；24h 内同 `jobId` 重复投递不会产生新任务。

## 环境变量（登记于根 `.env.example`）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis 连接（与缓存共用地址，BullMQ 用独立连接） |
| `QUEUE_PREFIX` | `xueji` | 队列键名前缀，多环境共用 Redis 时隔离 |
| `QUEUE_CONCURRENCY` | `4` | 每个队列的并发处理数 |
| `QUEUE_TZ` | `Asia/Shanghai` | 定时任务时区 |

## 本地与测试

- 起依赖：`pnpm db:up`（MySQL / Redis / MinIO）；worker 单跑：`pnpm --filter @xueji/server dev:worker`。
- 单元测试用假后端（`QueueBackendFactory`）注入，不连 Redis：`pnpm --filter @xueji/server test`。
- 需要真实 Redis 的集成场景放在 `test/**/*.e2e.ts`，用 `pnpm --filter @xueji/server test:e2e`。

## 任务清单

产品文档 §13.5 列出的异步 / 定时任务（`consumption.import`、`tier.recalc`、`alert.escalate`…）
由各自业务模块的 issue 在自己的模块目录内实现，本框架只提供注册与调度约定。
