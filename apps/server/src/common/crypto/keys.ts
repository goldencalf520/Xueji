import { createHash } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { CryptoEnv } from './crypto.config';
import { CryptoConfigError, EncryptedDataError } from './crypto.errors';

/**
 * 数据密钥提供者（§11.4 信封加密）。
 * local：从环境变量读取；tencent-kms：启动时用 KMS Decrypt 解出数据密钥，只保存在内存。
 * 密文第一字节是密钥版本号，解密按版本查表 —— 支持多版本并存以便轮换。
 */
export abstract class DataKeyProvider {
  /** 启动时执行：校验配置并解出全部版本的数据密钥，失败即启动失败 */
  abstract init(): Promise<void>;
  /** 版本号 → 32 字节 AES-256 密钥；版本未知抛 EncryptedDataError */
  abstract keyFor(version: number): Buffer;
  /** 当前加密使用的版本（多版本并存时为最大版本） */
  abstract activeVersion(): number;
  /** 全部已加载的版本（轮换工具用） */
  abstract versions(): number[];
}

const logger = new Logger('CryptoKeys');

/** AES-256 数据密钥固定 32 字节 */
export const DATA_KEY_BYTES = 32;
/** 密文头部的版本号占 1 字节 */
export const MAX_KEY_VERSION = 255;

/** 内置 dev 密钥（全零）：development / test 缺省时回退使用；staging / production 一律拒绝 */
export const DEV_DATA_KEY = Buffer.alloc(DATA_KEY_BYTES, 0);

const isDevEnv = (env: CryptoEnv['NODE_ENV']) => env === 'development' || env === 'test';

function decodeBase64(value: string, label: string): Buffer {
  const b64 = value.startsWith('base64:') ? value.slice('base64:'.length) : value;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
    throw new CryptoConfigError(`${label} 不是合法的 base64 字符串`);
  }
  const buf = Buffer.from(b64, 'base64');
  if (buf.length !== DATA_KEY_BYTES) {
    throw new CryptoConfigError(
      `${label} 解码后必须是 ${DATA_KEY_BYTES} 字节（AES-256），实际 ${buf.length} 字节`,
    );
  }
  return buf;
}

function assertNotDevKey(key: Buffer, env: CryptoEnv['NODE_ENV'], label: string): void {
  if (!isDevEnv(env) && key.equals(DEV_DATA_KEY)) {
    throw new CryptoConfigError(
      `${label} 使用了内置 dev 密钥（全零），禁止用于 staging / production`,
    );
  }
}

/**
 * 解析多版本密钥描述：`base64:<b64>`（= 版本 1）或 `1:base64:…,2:base64:…`（编号最大者为当前版本）。
 * 返回 Map<版本号, 密钥>，用于需要本地持有明文密钥的 local 提供者。
 */
export function parseVersionedKeySpec(spec: string, label: string): Map<number, Buffer> {
  const map = new Map<number, Buffer>();
  for (const raw of spec.split(',')) {
    const token = raw.trim();
    if (!token) continue;
    const m = token.match(/^(?:(\d+):)?base64:(.+)$/);
    if (!m?.[2]) {
      throw new CryptoConfigError(
        `${label} 中的片段 "${token}" 不符合 base64:<b64> 或 <版本>:base64:<b64> 格式`,
      );
    }
    const version = m[1] ? Number(m[1]) : 1;
    if (!Number.isInteger(version) || version < 1 || version > MAX_KEY_VERSION) {
      throw new CryptoConfigError(
        `${label} 中的密钥版本 ${version} 必须是 1–${MAX_KEY_VERSION} 的整数`,
      );
    }
    if (map.has(version)) throw new CryptoConfigError(`${label} 中版本 ${version} 重复`);
    map.set(version, decodeBase64(m[2], `${label} 版本 ${version}`));
  }
  if (map.size === 0) throw new CryptoConfigError(`${label} 未提供任何密钥`);
  return map;
}

/**
 * dev / test 缺省回退：返回内置 dev 密钥并告警；
 * staging / production 缺省：抛错（启动即失败，错误信息写明变量名）。
 */
export function devFallbackOrFatal(
  env: CryptoEnv['NODE_ENV'],
  label: string,
  varName: string,
): Buffer {
  if (isDevEnv(env)) {
    logger.warn(
      `${label} 未配置（${varName}），回退到内置 dev 密钥（全零）。dev / test 专用，严禁用于生产`,
    );
    return Buffer.from(DEV_DATA_KEY);
  }
  throw new CryptoConfigError(`未配置 ${varName}（${label}），staging / production 必须显式配置`);
}

/** 本地数据密钥（开发环境）：CRYPTO_LOCAL_DATA_KEY 多版本并存，最大版本为当前加密版本 */
export class LocalDataKeyProvider extends DataKeyProvider {
  private readonly keys: Map<number, Buffer>;

  constructor(env: CryptoEnv) {
    super();
    if (!env.CRYPTO_LOCAL_DATA_KEY) {
      const key = devFallbackOrFatal(env.NODE_ENV, '本地数据密钥', 'CRYPTO_LOCAL_DATA_KEY');
      this.keys = new Map([[1, key]]);
      return;
    }
    this.keys = parseVersionedKeySpec(env.CRYPTO_LOCAL_DATA_KEY, 'CRYPTO_LOCAL_DATA_KEY');
    for (const [version, key] of this.keys)
      assertNotDevKey(key, env.NODE_ENV, `CRYPTO_LOCAL_DATA_KEY 版本 ${version}`);
  }

  async init(): Promise<void> {
    /* local 提供者在构造时已完成全部校验，无需异步初始化 */
  }

  keyFor(version: number): Buffer {
    const key = this.keys.get(version);
    if (!key)
      throw new EncryptedDataError(`本地数据密钥没有版本 ${version}（密文由其他版本的密钥加密）`);
    return key;
  }

  activeVersion(): number {
    return Math.max(...this.keys.keys());
  }

  versions(): number[] {
    return [...this.keys.keys()].sort((a, b) => a - b);
  }
}

/** HMAC 查找哈希密钥：CRYPTO_HMAC_KEY（base64），与数据密钥相互独立（§13.5） */
export function loadHmacKey(env: CryptoEnv): Buffer {
  if (!env.CRYPTO_HMAC_KEY)
    return devFallbackOrFatal(env.NODE_ENV, 'HMAC 查找哈希密钥', 'CRYPTO_HMAC_KEY');
  const key = decodeBase64(env.CRYPTO_HMAC_KEY, 'CRYPTO_HMAC_KEY');
  assertNotDevKey(key, env.NODE_ENV, 'CRYPTO_HMAC_KEY');
  return key;
}

/**
 * 校验提供者与环境的组合（启动策略）：
 * staging / production 只允许 tencent-kms（local 提供者即使配置了真密钥也拒绝，防止误配）。
 */
export function assertProviderAllowed(env: CryptoEnv): void {
  if (!isDevEnv(env.NODE_ENV) && env.CRYPTO_PROVIDER === 'local') {
    throw new CryptoConfigError(
      `CRYPTO_PROVIDER=local 不允许用于 ${env.NODE_ENV}：staging / production 必须使用 tencent-kms 信封加密`,
    );
  }
}

/** 腾讯云 KMS Decrypt 响应里的 Plaintext 是 base64 字符串，此处复用同一校验逻辑 */
export function decodeKmsPlaintext(value: string, label: string): Buffer {
  return decodeBase64(value, label);
}

/** 供 KMS 提供者做"密钥指纹"日志输出：只展示 SHA-256 前 8 位，不泄露密钥 */
export function keyFingerprint(key: Buffer): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 8);
}
