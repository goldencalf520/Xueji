/**
 * 加密字段注册表（§11.4、§13.5）：模型名 → 需要自动加解密的字段集合。
 * 业务域模块在自己的模块文件顶部声明，例如：
 *
 *   registerEncryptedFields('Customer', ['phoneEnc', 'nameEnc'])
 *
 * 注册后经 PrismaService.client 读写这些字段时自动加解密，业务代码只接触明文；
 * 查找请写 *_hash 列（HashService.phoneHash），禁止对 Enc 字段做 where。
 */
const registry = new Map<string, ReadonlySet<string>>();

export function registerEncryptedFields(model: string, fields: readonly string[]): void {
  if (!model || typeof model !== 'string')
    throw new Error('registerEncryptedFields：model 不能为空');
  const invalid = fields.filter((f) => typeof f !== 'string' || !f.endsWith('Enc'));
  if (invalid.length > 0) {
    throw new Error(
      `registerEncryptedFields：${model} 的加密字段必须以 Enc 结尾（${invalid.join('、')}）`,
    );
  }
  const merged = new Set(registry.get(model) ?? []);
  for (const f of fields) merged.add(f);
  registry.set(model, merged);
}

/** 该模型的加密字段集合；未注册返回 undefined（扩展按"无加密字段"直通） */
export function encryptedFieldsOf(model: string): ReadonlySet<string> | undefined {
  return registry.get(model);
}

/** 全部已注册模型（文档与测试用） */
export function registeredEncryptedModels(): string[] {
  return [...registry.keys()];
}
