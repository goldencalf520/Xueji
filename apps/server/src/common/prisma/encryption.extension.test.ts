import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { CryptoService } from '../crypto/crypto.service';
import { DataKeyProvider } from '../crypto/keys';
import { applyEncryptionAroundOperation } from './encryption.extension';
import {
  encryptedFieldsOf,
  registerEncryptedFields,
  registeredEncryptedModels,
} from './encryption.registry';

/** 固定 32 字节密钥的真 AES 提供者：密文断言与解密还原都走真实算法 */
class FixedProvider extends DataKeyProvider {
  override async init(): Promise<void> {}
  override keyFor(): Buffer {
    return Buffer.alloc(32, 5);
  }
  override activeVersion(): number {
    return 1;
  }
  override versions(): number[] {
    return [1];
  }
}

const crypto = new CryptoService(new FixedProvider());

/** 每个用例用独立模型名注册，互不干扰 */
function setup(model: string, fields: readonly string[] = ['phoneEnc', 'nameEnc']) {
  registerEncryptedFields(model, fields);
  // applyEncryptionAroundOperation 一定会调用 query，返回后 captured 必有值；初始 {} 仅满足类型收窄
  let captured: Record<string, unknown> = {};
  const run = async (
    operation: string,
    args: Record<string, unknown>,
    resultFromDb: unknown,
  ): Promise<{ out: unknown; captured: Record<string, unknown> }> => {
    const query = async (a: Record<string, unknown>) => {
      captured = a;
      return typeof resultFromDb === 'function'
        ? (resultFromDb as () => unknown)()
        : structuredClone(resultFromDb);
    };
    const out = await applyEncryptionAroundOperation({ model, operation, args, query, crypto });
    return { out, captured };
  };
  return run;
}

describe('registerEncryptedFields（注册表）', () => {
  it('注册后可查询；重复注册合并去重', () => {
    registerEncryptedFields('RegModelA', ['aEnc']);
    registerEncryptedFields('RegModelA', ['aEnc', 'bEnc']);
    expect(encryptedFieldsOf('RegModelA')).toEqual(new Set(['aEnc', 'bEnc']));
    expect(registeredEncryptedModels()).toContain('RegModelA');
  });

  it('非 Enc 结尾的字段拒绝注册（命中：命名约定必须强制）', () => {
    expect(() => registerEncryptedFields('RegModelB', ['phone'])).toThrow(/Enc/);
    expect(() => registerEncryptedFields('', [])).toThrow();
  });
});

describe('加密扩展：写入路径', () => {
  it('create：明文字段变为密文 Uint8Array（版本号在第一字节）', async () => {
    const run = setup('WrModelA');
    const { captured } = await run(
      'create',
      { data: { phoneEnc: '13812345678', nameEnc: '张三', age: 30 } },
      {},
    );
    const phone = (captured.data as Record<string, unknown>).phoneEnc;
    expect(phone).toBeInstanceOf(Uint8Array);
    expect((phone as Uint8Array)[0]).toBe(1); // 密钥版本
    expect(crypto.decrypt(phone as Uint8Array)).toBe('13812345678');
    expect((captured.data as Record<string, unknown>).age).toBe(30); // 普通字段不动
  });

  it('update / updateMany：data 中的明文加密（命中）', async () => {
    const run = setup('WrModelB');
    const u = await run('update', { where: { id: '1' }, data: { nameEnc: '李四' } }, {});
    expect(((u.captured.data as Record<string, unknown>).nameEnc as Uint8Array)[0]).toBe(1);
    const um = await run(
      'updateMany',
      { where: { tag: 'vip' }, data: { nameEnc: '李四' } },
      { count: 1 },
    );
    expect((um.captured.data as Record<string, unknown>).nameEnc).toBeInstanceOf(Uint8Array);
  });

  it('createMany / createManyAndReturn：数组 data 逐条加密（命中）', async () => {
    const run = setup('WrModelC');
    const { captured } = await run(
      'createMany',
      { data: [{ phoneEnc: 'a1' }, { phoneEnc: 'a2' }, { note: 'x' }] },
      { count: 3 },
    );
    const rows = captured.data as unknown[];
    expect((rows[0] as Record<string, unknown>).phoneEnc).toBeInstanceOf(Uint8Array);
    expect((rows[1] as Record<string, unknown>).phoneEnc).toBeInstanceOf(Uint8Array);
    expect((rows[2] as Record<string, unknown>).note).toBe('x');
  });

  it('upsert：create 与 update 两个容器都加密（命中）', async () => {
    const run = setup('WrModelD');
    const { captured } = await run(
      'upsert',
      { where: { id: '1' }, create: { nameEnc: '王五' }, update: { nameEnc: '赵六' } },
      {},
    );
    expect((captured.create as Record<string, unknown>).nameEnc).toBeInstanceOf(Uint8Array);
    expect((captured.update as Record<string, unknown>).nameEnc).toBeInstanceOf(Uint8Array);
    expect(crypto.decrypt((captured.create as Record<string, unknown>).nameEnc as Uint8Array)).toBe(
      '王五',
    );
    expect(crypto.decrypt((captured.update as Record<string, unknown>).nameEnc as Uint8Array)).toBe(
      '赵六',
    );
  });

  it('null 与已加密 Uint8Array 原样放行，不二次加密（不命中）', async () => {
    const run = setup('WrModelE');
    const pre = crypto.encrypt('原密文');
    const { captured } = await run('create', { data: { phoneEnc: null, nameEnc: pre } }, {});
    expect((captured.data as Record<string, unknown>).phoneEnc).toBeNull();
    expect((captured.data as Record<string, unknown>).nameEnc).toBe(pre);
  });

  it('非法类型（number）：报错（命中：不能静默丢失明文）', async () => {
    const run = setup('WrModelF');
    await expect(run('create', { data: { phoneEnc: 12345 } }, {})).rejects.toThrow(/只接受/);
  });

  it('where 出现 Enc 字段：报错并提示走 *_hash（命中）', async () => {
    const run = setup('WrModelG');
    await expect(run('findUnique', { where: { phoneEnc: 'x' } }, null)).rejects.toThrow(/\*_hash/);
    await expect(
      run('update', { where: { nameEnc: 'x' }, data: { note: 'a' } }, {}),
    ).rejects.toThrow(/nameEnc/);
    await expect(
      run('updateMany', { where: { phoneEnc: 'x' }, data: { note: 'a' } }, { count: 0 }),
    ).rejects.toThrow(/phoneEnc/);
  });

  it('where 用普通字段（含 *_hash）：正常通过（不命中）', async () => {
    const run = setup('WrModelH');
    const { out } = await run('findUnique', { where: { phoneHash: 'ab12' } }, null);
    expect(out).toBeNull();
  });
});

describe('加密扩展：读取路径', () => {
  it('findMany：结果行内的密文解密回明文（命中）', async () => {
    const run = setup('RdModelA');
    const rows = [
      { id: '1', phoneEnc: crypto.encrypt('13812345678'), age: 60 },
      { id: '2', phoneEnc: crypto.encrypt('13999999999'), age: 70 },
    ];
    const { out } = await run('findMany', { where: { age: { gte: 60 } } }, rows);
    const result = out as { phoneEnc: string }[];
    expect(result[0].phoneEnc).toBe('13812345678');
    expect(result[1].phoneEnc).toBe('13999999999');
    expect(result[0].age).toBe(60);
  });

  it('findUnique / update 返回单行：解密（命中）', async () => {
    const run = setup('RdModelB');
    const row = { id: '1', nameEnc: crypto.encrypt('张三') };
    const single = await run('findUnique', { where: { id: '1' } }, row);
    expect((single.out as Record<string, unknown>).nameEnc).toBe('张三');

    const updated = await run(
      'update',
      { where: { id: '1' }, data: { age: 61 } },
      { ...row, age: 61 },
    );
    expect((updated.out as Record<string, unknown>).nameEnc).toBe('张三');
  });

  it('create 返回行 / createManyAndReturn：解密（命中）', async () => {
    const run = setup('RdModelC');
    const created = await run('create', { data: { phoneEnc: '13812345678' } }, () => ({
      id: '9',
      phoneEnc: crypto.encrypt('13812345678'),
    }));
    expect((created.out as Record<string, unknown>).phoneEnc).toBe('13812345678');
    expect(((created.captured.data as Record<string, unknown>).phoneEnc as Uint8Array)[0]).toBe(1);

    const many = await run('createManyAndReturn', { data: [{ nameEnc: 'x' }] }, [
      { id: '1', nameEnc: crypto.encrypt('x') },
    ]);
    expect((many.out as Record<string, unknown>[])[0].nameEnc).toBe('x');
  });

  it('count / updateMany 的 {count} 结果不受影响（不命中）', async () => {
    const run = setup('RdModelD');
    const { out } = await run('count', { where: {} }, 5);
    expect(out).toBe(5);
    const up = await run('updateMany', { where: {}, data: { nameEnc: 'x' } }, { count: 2 });
    expect(up.out).toEqual({ count: 2 });
  });

  it('嵌套对象（同模型自关联行）也解密（命中）', async () => {
    const run = setup('RdModelE');
    const row = {
      id: '1',
      nameEnc: crypto.encrypt('父'),
      children: [{ nameEnc: crypto.encrypt('子') }],
    };
    const { out } = await run('findUnique', { where: { id: '1' } }, row);
    const parent = out as Record<string, unknown>;
    expect(parent.nameEnc).toBe('父');
    expect((parent.children as Record<string, unknown>[])[0].nameEnc).toBe('子');
  });

  it('未注册加密字段的模型完全直通（不命中）', async () => {
    const query = async (a: Record<string, unknown>) => a;
    const out = await applyEncryptionAroundOperation({
      model: 'PlainModel',
      operation: 'create',
      args: { data: { phoneEnc: '13812345678' } },
      query,
      crypto,
    });
    expect((out as Record<string, unknown>).data).toEqual({ phoneEnc: '13812345678' });
  });
});
