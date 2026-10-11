import { createHash, createHmac } from 'node:crypto';
import type { CryptoEnv } from './crypto.config';
import { CryptoConfigError, EncryptedDataError } from './crypto.errors';
import { DATA_KEY_BYTES, DataKeyProvider, keyFingerprint, MAX_KEY_VERSION } from './keys';

/**
 * 腾讯云 KMS 密钥提供者（§11.4 信封加密）：
 * 数据密钥由 KMS 生成并托管，启动时用 Decrypt 解出到内存，不落盘、不进日志。
 * 直接按 API 3.0 签名调用 kms.<region>.tencentcloudapi.com，不引入 SDK 依赖。
 */
export const KMS_SERVICE = 'kms';
export const KMS_API_VERSION = '2019-01-18';

const sha256hex = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const hmac = (key: string | Buffer, data: string) =>
  createHmac('sha256', key).update(data).digest();

/** TC3-HMAC-SHA256 签名（腾讯云 API 3.0），输入固定后完全确定，便于单元测试 */
export function tc3Authorization(params: {
  host: string;
  service: string;
  secretId: string;
  secretKey: string;
  action: string;
  payload: string;
  timestampSec: number;
}): { authorization: string; signedHeaders: string } {
  const { host, service, secretId, secretKey, action, payload, timestampSec } = params;
  const date = new Date(timestampSec * 1000).toISOString().slice(0, 10);
  const hashedPayload = sha256hex(payload);
  // 规范化请求：方法\nURI\n查询串\n规范化头\n签名头\n哈希后的请求体（x-tc-action 的值必须小写）
  const canonicalRequest = [
    'POST',
    '/',
    '',
    `content-type:application/json; charset=utf-8\nhost:${host}\nx-tc-action:${action.toLowerCase()}\n`,
    'content-type;host;x-tc-action',
    hashedPayload,
  ].join('\n');
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = [
    'TC3-HMAC-SHA256',
    String(timestampSec),
    credentialScope,
    sha256hex(canonicalRequest),
  ].join('\n');
  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, service);
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
  const signedHeaders = 'content-type;host;x-tc-action';
  return {
    authorization: `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    signedHeaders,
  };
}

/** KMS Decrypt 一次调用：CiphertextBlob → 明文 base64。fetch 与时间可注入以便测试 */
export async function kmsDecrypt(params: {
  region: string;
  secretId: string;
  secretKey: string;
  ciphertextBlob: string;
  timestampSec?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const { region, secretId, secretKey, ciphertextBlob } = params;
  const host = `kms.${region}.tencentcloudapi.com`;
  const action = 'Decrypt';
  const payload = JSON.stringify({ CiphertextBlob: ciphertextBlob });
  const timestampSec = params.timestampSec ?? Math.floor(Date.now() / 1000);
  const { authorization } = tc3Authorization({
    host,
    service: KMS_SERVICE,
    secretId,
    secretKey,
    action,
    payload,
    timestampSec,
  });
  const response = await (params.fetchImpl ?? fetch)(`https://${host}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Host: host,
      'X-TC-Action': action,
      'X-TC-Timestamp': String(timestampSec),
      'X-TC-Version': KMS_API_VERSION,
      'X-TC-Region': region,
      Authorization: authorization,
    },
    body: payload,
    signal: AbortSignal.timeout(params.timeoutMs ?? 10_000),
  });
  if (!response.ok)
    throw new CryptoConfigError(`KMS Decrypt HTTP ${response.status}，请检查 TENCENT_KMS_* 配置`);
  const json = (await response.json()) as {
    Response: { Plaintext?: string; Error?: { Code: string; Message: string } };
  };
  if (json.Response?.Error) {
    throw new CryptoConfigError(
      `KMS Decrypt 失败：${json.Response.Error.Code} ${json.Response.Error.Message}`,
    );
  }
  if (!json.Response?.Plaintext) throw new CryptoConfigError('KMS Decrypt 响应缺少 Plaintext');
  return json.Response.Plaintext;
}

/**
 * KMS 数据密钥提供者。TENCENT_KMS_ENCRYPTED_DATA_KEY 支持：
 *   `<CiphertextBlob>`（= 版本 1）或多版本 `1:<blob>,2:<blob>`（编号最大者为当前加密版本）。
 * init() 对每个版本各调用一次 KMS Decrypt；任一失败即启动失败。
 */
export class TencentKmsDataKeyProvider extends DataKeyProvider {
  /** 版本号 → KMS 加密后的数据密钥（CiphertextBlob），init 时解出明文 */
  private readonly blobs = new Map<number, string>();
  private readonly keys = new Map<number, Buffer>();

  constructor(
    private readonly env: CryptoEnv,
    private readonly deps: { decrypt?: typeof kmsDecrypt; now?: () => number } = {},
  ) {
    super();
    if (!env.TENCENT_KMS_REGION)
      throw new CryptoConfigError('未配置 TENCENT_KMS_REGION（KMS 地域）');
    if (!env.TENCENT_SECRET_ID || !env.TENCENT_SECRET_KEY) {
      throw new CryptoConfigError('未配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY（腾讯云凭证）');
    }
    if (!env.TENCENT_KMS_ENCRYPTED_DATA_KEY) {
      throw new CryptoConfigError('未配置 TENCENT_KMS_ENCRYPTED_DATA_KEY（KMS 加密的数据密钥）');
    }
    for (const raw of env.TENCENT_KMS_ENCRYPTED_DATA_KEY.split(',')) {
      const token = raw.trim();
      if (!token) continue;
      const m = token.match(/^(?:(\d+):)?(.+)$/);
      if (!m?.[2])
        throw new CryptoConfigError(`TENCENT_KMS_ENCRYPTED_DATA_KEY 中的片段 "${token}" 不合法`);
      const version = m[1] ? Number(m[1]) : 1;
      if (!Number.isInteger(version) || version < 1 || version > MAX_KEY_VERSION) {
        throw new CryptoConfigError(
          `TENCENT_KMS_ENCRYPTED_DATA_KEY 中的版本 ${version} 必须是 1–${MAX_KEY_VERSION} 的整数`,
        );
      }
      if (this.blobs.has(version))
        throw new CryptoConfigError(`TENCENT_KMS_ENCRYPTED_DATA_KEY 中版本 ${version} 重复`);
      this.blobs.set(version, m[2]);
    }
    if (this.blobs.size === 0)
      throw new CryptoConfigError('TENCENT_KMS_ENCRYPTED_DATA_KEY 未提供任何数据密钥');
  }

  async init(): Promise<void> {
    const {
      TENCENT_KMS_REGION: region,
      TENCENT_SECRET_ID: secretId,
      TENCENT_SECRET_KEY: secretKey,
    } = this.env;
    if (!region || !secretId || !secretKey) {
      throw new CryptoConfigError(
        'TENCENT_KMS_REGION / TENCENT_SECRET_ID / TENCENT_SECRET_KEY 未配置（tencent-kms 提供者必需）',
      );
    }
    const decrypt = this.deps.decrypt ?? kmsDecrypt;
    for (const [version, blob] of this.blobs) {
      const plaintext = await decrypt({
        region,
        secretId,
        secretKey,
        ciphertextBlob: blob,
        timestampSec: this.deps.now?.(),
      });
      const key = Buffer.from(plaintext, 'base64');
      if (key.length !== DATA_KEY_BYTES) {
        throw new CryptoConfigError(
          `KMS 解出的数据密钥（版本 ${version}）必须是 ${DATA_KEY_BYTES} 字节，实际 ${key.length} 字节`,
        );
      }
      this.keys.set(version, key);
    }
  }

  keyFor(version: number): Buffer {
    const key = this.keys.get(version);
    if (!key)
      throw new EncryptedDataError(`KMS 数据密钥没有版本 ${version}（密文由其他版本的密钥加密）`);
    return key;
  }

  activeVersion(): number {
    return Math.max(...this.keys.keys());
  }

  versions(): number[] {
    return [...this.keys.keys()].sort((a, b) => a - b);
  }

  /** 仅用于启动日志：确认各版本密钥已加载且相互不同，不泄露密钥本身 */
  loadedFingerprints(): Record<number, string> {
    return Object.fromEntries([...this.keys].map(([v, k]) => [v, keyFingerprint(k)]));
  }
}
