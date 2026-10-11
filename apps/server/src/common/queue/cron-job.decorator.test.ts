import { describe, expect, it } from 'vitest';
import {
  CronJob,
  type CronJobDefinition,
  collectCronJobs,
  collectCronJobsFromProviders,
} from './cron-job.decorator';

class AllJobs {
  ran = 0;

  @CronJob({ name: 'alert.escalate', pattern: '*/5 * * * *' })
  escalate() {
    this.ran += 1;
    return 'escalated';
  }

  @CronJob({
    name: 'stats.aggregate',
    pattern: '0 5 * * *',
    queue: 'stats',
    tz: 'Asia/Shanghai',
    data: { scope: 'daily' },
  })
  aggregate() {
    this.ran += 10;
  }

  notAJob() {
    return 'plain';
  }
}

class PlainJobs {
  tick() {
    return 'noop';
  }
}

function byName(defs: CronJobDefinition[], name: string): CronJobDefinition {
  const found = defs.find((def) => def.options.name === name);
  if (!found) throw new Error(`未找到定时任务 ${name}`);
  return found;
}

describe('@CronJob', () => {
  it('收集被标注的方法，并补全默认 queue', () => {
    const defs = collectCronJobs(new AllJobs());
    expect(defs.map((def) => def.options.name).sort()).toEqual([
      'alert.escalate',
      'stats.aggregate',
    ]);
    expect(byName(defs, 'alert.escalate').options.queue).toBe('default');
    expect(byName(defs, 'alert.escalate').options.pattern).toBe('*/5 * * * *');
    expect(byName(defs, 'stats.aggregate').options.queue).toBe('stats');
    expect(byName(defs, 'stats.aggregate').options.data).toEqual({ scope: 'daily' });
  });

  it('未标注的类不产生定时任务（不命中）', () => {
    expect(collectCronJobs(new PlainJobs())).toEqual([]);
  });

  it('handler 绑定实例，this 指向正确', () => {
    const jobs = new AllJobs();
    byName(collectCronJobs(jobs), 'alert.escalate').handler();
    expect(jobs.ran).toBe(1);
  });

  it('批量收集会过滤掉非对象项', () => {
    const defs = collectCronJobsFromProviders([new AllJobs(), null as unknown as object]);
    expect(defs).toHaveLength(2);
  });

  it('缺少 name / pattern 时直接报错', () => {
    expect(() => CronJob({ name: '', pattern: '* * * * *' })).toThrow(/@CronJob/);
    expect(() => CronJob({ name: 'x', pattern: '' })).toThrow(/@CronJob/);
  });
});
