import { describe, expect, it } from 'vitest';
import { workerOnly } from './worker-only';

describe('workerOnly', () => {
  const providers = ['ConsumptionImportProcessor', 'AlertEscalateProcessor'];

  it('worker 进程返回全部处理器', () => {
    expect(workerOnly(providers, 'worker')).toEqual(providers);
  });

  it('api 进程返回空数组（api 不注册任何处理器）', () => {
    expect(workerOnly(providers, 'api')).toEqual([]);
  });

  it('role 缺省（未设置 APP_ROLE）时按 api 处理', () => {
    expect(workerOnly(providers, undefined)).toEqual([]);
  });

  it('返回副本，不修改入参', () => {
    expect(workerOnly(providers, 'worker')).not.toBe(providers);
  });
});
