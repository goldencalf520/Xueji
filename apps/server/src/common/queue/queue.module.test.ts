import { type INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Job, Queue, Worker } from 'bullmq';
import { afterEach, describe, expect, it } from 'vitest';
import { CommonModule } from '../common.module';
import { EXAMPLE_HEARTBEAT_JOB, EXAMPLE_QUEUE, ExampleJobs } from './example/example.jobs';
import { QueueConfig, type QueueEnv } from './queue.config';
import { QueueConnection } from './queue.connection';
import { QueueService } from './queue.service';
import { BullQueueBackendFactory } from './queue-backend';
import { workerOnly } from './worker-only';

/** 模拟业务模块：api 进程用 workerOnly 让处理器类不进容器 */
@Module({ providers: workerOnly([ExampleJobs], 'api') })
class ApiFeatureModule {}

/** 模拟业务模块：worker 进程注册处理器 */
@Module({ providers: workerOnly([ExampleJobs], 'worker') })
class WorkerFeatureModule {}

interface Recorder {
  queues: string[];
  workers: string[];
  schedulers: string[];
}

function createFakeBackend(recorder: Recorder): BullQueueBackendFactory {
  return {
    createQueue: (name: string) => {
      recorder.queues.push(name);
      return {
        add: async () => ({ id: '1' }) as unknown as Job,
        upsertJobScheduler: async (id: string) => {
          recorder.schedulers.push(id);
          return { id } as unknown as Job;
        },
        close: async () => undefined,
      } as unknown as Queue;
    },
    createWorker: (name: string) => {
      recorder.workers.push(name);
      return { on: () => undefined, close: async () => undefined } as unknown as Worker;
    },
  } as unknown as BullQueueBackendFactory;
}

const baseEnv: QueueEnv = {
  NODE_ENV: 'test',
  APP_ROLE: 'api',
  REDIS_URL: 'redis://localhost:6379',
  QUEUE_PREFIX: 'test',
  QUEUE_CONCURRENCY: 2,
  QUEUE_TZ: 'Asia/Shanghai',
};

const opened: INestApplication[] = [];

async function bootstrap(
  role: 'api' | 'worker',
  featureModule: new () => unknown,
): Promise<{ app: INestApplication; recorder: Recorder; service: QueueService }> {
  const recorder: Recorder = { queues: [], workers: [], schedulers: [] };
  const moduleRef = await Test.createTestingModule({
    imports: [CommonModule, featureModule],
  })
    .overrideProvider(BullQueueBackendFactory)
    .useValue(createFakeBackend(recorder))
    .overrideProvider(QueueConnection)
    .useValue({ client: {}, prefix: 'test', concurrency: 2, timezone: 'Asia/Shanghai' })
    .overrideProvider(QueueConfig)
    .useValue(new QueueConfig({ ...baseEnv, APP_ROLE: role }))
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  opened.push(app);
  return { app, recorder, service: app.get(QueueService) };
}

describe('QueueModule 装配', () => {
  afterEach(async () => {
    await Promise.all(opened.splice(0).map((app) => app.close()));
  });

  it('api 进程不创建任何 worker，也不注册定时任务', async () => {
    const { recorder, service } = await bootstrap('api', ApiFeatureModule);
    expect(recorder.workers).toEqual([]);
    expect(recorder.schedulers).toEqual([]);
    expect(service.describe()).toEqual({ queues: [], cronJobs: [], workers: 0 });
  });

  it('worker 进程为 @QueueProcessor 建 worker，并 upsert 定时任务', async () => {
    const { recorder, service } = await bootstrap('worker', WorkerFeatureModule);
    expect(recorder.workers).toEqual([EXAMPLE_QUEUE]);
    expect(recorder.schedulers).toEqual([`cron:${EXAMPLE_HEARTBEAT_JOB}`]);
    expect(service.describe()).toEqual({
      queues: [EXAMPLE_QUEUE],
      cronJobs: [EXAMPLE_HEARTBEAT_JOB],
      workers: 1,
    });
  });
});
