import { Prisma } from '../../generated/prisma/client';
import type { CryptoService } from '../crypto/crypto.service';
import { encryptedFieldsOf } from './encryption.registry';

/** 扩展依赖的加解密能力（测试可替换） */
export type CryptoApi = Pick<CryptoService, 'encrypt' | 'decrypt'>;

/** 顶层 data 容器随操作不同：create/update 为对象，createMany 为数组，upsert 为 create+update */
function dataContainersOf(operation: string, args: Record<string, unknown>): unknown[] {
  switch (operation) {
    case 'create':
    case 'update':
    case 'updateMany':
      return [args.data];
    case 'createMany':
    case 'createManyAndReturn':
      return Array.isArray(args.data) ? args.data : [args.data];
    case 'upsert':
      return [args.create, args.update];
    default:
      return [];
  }
}

/** 拒绝对 Enc 字段做 where 查找：密文不可比较，查找必须走 *_hash 列（命中必须报错，防止误查泄漏空结果） */
function assertNoEncFieldInWhere(
  operation: string,
  args: Record<string, unknown>,
  fields: ReadonlySet<string>,
): void {
  const where = args.where;
  if (where === undefined || where === null || typeof where !== 'object') return;
  for (const key of Object.keys(where)) {
    if (fields.has(key)) {
      throw new Error(
        `加密字段 ${key} 不能用于 ${operation} 的 where 条件（密文不可比较）：请使用对应的 *_hash 字段查找`,
      );
    }
  }
}

/** 写入前把明文（string）替换为密文 Uint8Array；null 与已有二进制（已密文）原样放行 */
function encryptDataContainers(
  containers: unknown[],
  fields: ReadonlySet<string>,
  crypto: CryptoApi,
  model: string,
): void {
  for (const container of containers) {
    if (container === undefined || container === null || typeof container !== 'object') continue;
    for (const field of fields) {
      if (!(field in container)) continue;
      const value = (container as Record<string, unknown>)[field];
      if (value === undefined || value === null) continue;
      if (value instanceof Uint8Array) continue; // 调用方已传密文（如批量迁移工具）
      if (typeof value !== 'string') {
        throw new Error(`${model}.${field} 加密字段只接受明文 string / null / 已加密的 Uint8Array`);
      }
      (container as Record<string, unknown>)[field] = crypto.encrypt(value);
    }
  }
}

/** 读取后把结果行里的密文还原为明文；递归处理数组与嵌套对象（同模型自关联行） */
function decryptResultRows(
  value: unknown,
  fields: ReadonlySet<string>,
  crypto: CryptoApi,
): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((row) => decryptResultRows(row, fields, crypto));
  if (typeof value !== 'object' || value instanceof Uint8Array || value instanceof Date)
    return value;
  const row = value as Record<string, unknown>;
  for (const field of fields) {
    if (field in row && row[field] instanceof Uint8Array) {
      row[field] = crypto.decrypt(row[field] as Uint8Array);
    }
  }
  for (const [key, nested] of Object.entries(row)) {
    if (nested !== null && typeof nested === 'object')
      row[key] = decryptResultRows(nested, fields, crypto);
  }
  return row;
}

/**
 * 单个 Prisma 操作的加密包装：加密写入、拒绝 where、解密读取。
 * 独立导出便于单元测试（不需要真实数据库）。
 */
export async function applyEncryptionAroundOperation(params: {
  model: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => Promise<unknown>;
  crypto: CryptoApi;
}): Promise<unknown> {
  const { model, operation, args, query, crypto } = params;
  const fields = encryptedFieldsOf(model);
  if (!fields || fields.size === 0) return query(args); // 未注册加密字段的模型完全直通
  assertNoEncFieldInWhere(operation, args, fields);
  encryptDataContainers(dataContainersOf(operation, args), fields, crypto, model);
  const result = await query(args);
  return decryptResultRows(result, fields, crypto);
}

/** $allOperations 回调的运行时参数形状（Prisma 传入） */
interface AllOperationsParams {
  model: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Prisma 客户端加密扩展（§13.5：ORM 层统一加解密，业务代码只处理明文）。
 * 挂载见 PrismaService.client；业务模块先 registerEncryptedFields 再使用 client。
 * 回调整体 as never：扩展在类型层完全透明（extended client 与原 client 同型），
 * 加解密只发生在运行时。
 */
export function buildEncryptionExtension(getCrypto: () => CryptoApi) {
  const allOperations = async (params: AllOperationsParams) =>
    applyEncryptionAroundOperation({ ...params, crypto: getCrypto() });
  return Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        $allModels: {
          $allOperations: allOperations as never,
        },
      },
    }),
  );
}
