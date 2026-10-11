import { z } from 'zod';

/**
 * 字段加密的环境变量（common/crypto 独占，§11.4、§13.5）。
 * 变量名登记在仓库根目录 .env.example：
 *
 *   CRYPTO_PROVIDER                 local | tencent-kms
 *   CRYPTO_LOCAL_DATA_KEY           本地数据密钥，格式 base64:<b64>；多版本轮换用
 *                                   `1:base64:…,2:base64:…`（编号最大者为当前加密版本）
 *   CRYPTO_HMAC_KEY                 查找哈希（*_hash）的 HMAC 密钥，base64:<b64>
 *   TENCENT_KMS_REGION              KMS 所在地域，如 ap-guangzhou
 *   TENCENT_KMS_KEY_ID              KMS 主密钥 ID（CMK）
 *   TENCENT_KMS_ENCRYPTED_DATA_KEY  KMS 加密后的数据密钥（CiphertextBlob，多版本语法同上）
 *   TENCENT_SECRET_ID / TENCENT_SECRET_KEY  腾讯云通用凭证
 *
 * 密钥缺失时 development / test 回退到内置 dev 密钥并告警；staging / production 启动即失败，
 * 且 local 提供者、全零 dev 密钥在 staging / production 一律拒绝（见 keys.ts）。
 */
export const CryptoEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  CRYPTO_PROVIDER: z.enum(['local', 'tencent-kms']).default('local'),
  CRYPTO_LOCAL_DATA_KEY: z.string().optional(),
  CRYPTO_HMAC_KEY: z.string().optional(),
  TENCENT_KMS_REGION: z.string().optional(),
  TENCENT_KMS_KEY_ID: z.string().optional(),
  TENCENT_KMS_ENCRYPTED_DATA_KEY: z.string().optional(),
  TENCENT_SECRET_ID: z.string().optional(),
  TENCENT_SECRET_KEY: z.string().optional(),
});
export type CryptoEnv = z.infer<typeof CryptoEnv>;

export function loadCryptoEnv(source: NodeJS.ProcessEnv = process.env): CryptoEnv {
  const parsed = CryptoEnv.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`字段加密（common/crypto）环境变量校验失败：\n${issues}`);
  }
  return parsed.data;
}
