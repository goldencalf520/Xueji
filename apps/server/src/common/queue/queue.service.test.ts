import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { Job, Queue, Worker } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueueConnection } from './queue.connection';
import { DEFAULT_JOB_ATTEMPTS } from './queue.constants';
import { QUEUE_FAILED_EVENT } from './queue.events';
import { QueueService } from './queue.service';
import { BullQueueBackendFactory } from './queue-backend';

class FakeQueue {
  readonly adds: Array<{ name: string; data: unknown; options: unknown }> = [];
  readonly schedulers: Array<{ id: string; repeat: unknown; template: unknown }> = [];
  closed = false;

  async add(name: string, data: unknown, options: unknown): Promise<Job> {
    this.adds.push({ name, data, options });
    return { id: '1', name } as unknown as Job;
  }

  async upsertJobScheduler(id: string, repeat: unknown, template: unknown): Promise<Job> {
    this.schedulers.push({ id, repeat, template });
    return { id } as unknown as Job;
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

class FakeWorker {
  readonly handlers = new Map<string, (...args: unknown[]) => void>();
  closed = false;

  constructor(readonly name: string) {}

  on(event: string, handler: (...args: unknown[]) => void): this {
    this.handlers.set(event, handler);
    return this;
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

interface Harness {
  service: QueueService;
  queues: FakeQueue[];
  workers: FakeWorker[];
  emit: ReturnType<typeof vi.fn>;
}

function createHarness(): Harness {
  const queues: FakeQueue[] = [];
  const workers: FakeWorker[] = [];
  const backend = {
    createQueue: () => {
      const queue = new FakeQueue();
      queues.push(queue);
      return queue as unknown as Queue;
    },
    createWorker: (name: string) => {
      const worker = new FakeWorker(name);
      workers.push(worker);
      return worker as unknown as Worker;
    },
  } as unknown as BullQueueBackendFactory;
  const connection = {
    client: {},
    prefix: 'xueji',
    concurrency: 4,
    timezone: 'Asia/Shanghai',
  } as unknown as QueueConnection;
  const emit = vi.fn();
  const events = { emit } as unknown as EventEmitter2;
  return { service: new QueueService(backend, connection, events), queues, workers, emit };
}

describe('QueueService', () => {
  let harness: Harness;
  beforeEach(() => {
    harness = createHarness();
  });

  it('getQueue 复用同一个队列实例', () => {
    const first = harness.service.getQueue('consumption');
    const second = harness.service.getQueue('consumption');
    expect(first).toBe(second);
    expect(harness.queues).toHaveLength(1);
  });

  it('enqueue 合并默认选项（含重试与退避）', async () => {
    await harness.service.enqueue('consumption', 'consumption.import', { importId: '7' });
    const call = harness.queues[0]?.adds[0];
    expect(call?.name).toBe('consumption.import');
    expect(call?.data).toEqual({ importId: '7' });
    expect(call?.options).toMatchObject({ attempts: DEFAULT_JOB_ATTEMPTS });
  });

  it('scheduleCron 用 cron:<name> 幂等 upsert，并默认用 Asia/Shanghai', async () => {
    await harness.service.scheduleCron({
      options: { name: 'alert.escalate', pattern: '*/5 * * * *', queue: 'alert' },
      handler: () => undefined,
    });
    const scheduler = harness.queues[0]?.schedulers[0];
    expect(scheduler?.id).toBe('cron:alert.escalate');
    expect(scheduler?.repeat).toEqual({ pattern: '*/5 * * * *', tz: 'Asia/Shanghai' });
    expect(harness.service.describe().cronJobs).toEqual(['alert.escalate']);
  });

  it('scheduleCron 尊重显式 tz', async () => {
    await harness.service.scheduleCron({
      options: { name: 'x', pattern: '0 1 * * *', queue: 'q', tz: 'UTC' },
      handler: () => undefined,
    });
    expect(harness.queues[0]?.schedulers[0]?.repeat).toEqual({ pattern: '0 1 * * *', tz: 'UTC' });
  });

  it('createWorker 注册失败与错误监听', () => {
    harness.service.createWorker('alert', async () => undefined);
    const worker = harness.workers[0];
    expect(worker?.name).toBe('alert');
    expect(worker?.handlers.has('failed')).toBe(true);
    expect(worker?.handlers.has('error')).toBe(true);
    expect(harness.service.describe().workers).toBe(1);
  });

  it('任务重试耗尽才发布 queue.failed（未耗尽不发布）', () => {
    harness.service.createWorker('alert', async () => undefined);
    const failed = harness.workers[0]?.handlers.get('failed');
    const job = { name: 'alert.escalate', id: '9', opts: { attempts: 3 }, attemptsMade: 1 };
    failed?.(job, new Error('boom'));
    expect(harness.emit).not.toHaveBeenCalled();

    failed?.({ ...job, attemptsMade: 3 }, new Error('boom'));
    expect(harness.emit).toHaveBeenCalledTimes(1);
    expect(harness.emit).toHaveBeenCalledWith(
      QUEUE_FAILED_EVENT,
      expect.objectContaining({ queue: 'alert', jobName: 'alert.escalate', jobId: '9' }),
    );
  });

  it('onModuleDestroy 关闭全部队列与 worker', async () => {
    harness.service.getQueue('a');
    harness.service.createWorker('a', async () => undefined);
    await harness.service.onModuleDestroy();
    expect(harness.queues[0]?.closed).toBe(true);
    expect(harness.workers[0]?.closed).toBe(true);
    expect(harness.service.describe()).toEqual({ queues: [], cronJobs: [], workers: 0 });
  });
});
