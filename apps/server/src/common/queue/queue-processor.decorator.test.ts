import type { Job } from 'bullmq';
import { describe, expect, it } from 'vitest';
import { collectProcessor, collectProcessors, QueueProcessor } from './queue-processor.decorator';

@QueueProcessor({ queue: 'consumption' })
class ConsumptionProcessor {
  calls = 0;
  async process(_job: Job): Promise<string> {
    this.calls += 1;
    return 'ok';
  }
}

@QueueProcessor()
class DefaultQueueProcessor {
  async process(): Promise<void> {}
}

class NotAProcessor {
  async process(): Promise<void> {}
}

@QueueProcessor({ queue: 'broken' })
class MissingProcessMethod {
  run(): void {}
}

describe('@QueueProcessor', () => {
  it('解析队列名并绑定 process 方法', async () => {
    const instance = new ConsumptionProcessor();
    const registration = collectProcessor(instance);
    expect(registration?.queue).toBe('consumption');
    await registration?.process({ name: 'consumption.import' } as Job);
    expect(instance.calls).toBe(1);
  });

  it('未指定队列时落到默认队列', () => {
    expect(collectProcessor(new DefaultQueueProcessor())?.queue).toBe('default');
  });

  it('未标注的类返回 undefined（不命中）', () => {
    expect(collectProcessor(new NotAProcessor())).toBeUndefined();
  });

  it('@QueueProcessor 缺 process 方法直接报错', () => {
    expect(() => collectProcessor(new MissingProcessMethod())).toThrow(/必须实现 process/);
  });

  it('批量解析会滤掉非处理器 provider', () => {
    const registrations = collectProcessors([
      new ConsumptionProcessor(),
      new NotAProcessor(),
      null as unknown as object,
    ]);
    expect(registrations.map((r) => r.queue)).toEqual(['consumption']);
  });
});
