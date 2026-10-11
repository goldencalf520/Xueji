import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { loadCryptoEnv } from './crypto.config';
import { CryptoConfigError } from './crypto.errors';
import {
  assertProviderAllowed,
  DEV_DATA_KEY,
  LocalDataKeyProvider,
  loadHmacKey,
  parseVersionedKeySpec,
} from './keys';

const K1 = Buffer.alloc(32, 1).toString('base64');
const K2 = Buffer.alloc(32, 2).toString('base64');
const ZERO = DEV_DATA_KEY.toString('base64');

/** 只覆盖加密相关变量的最小环境 */
function env(over: Record<string, string> = {}) {
  return loadCryptoEnv({ NODE_ENV: 'development', CRYPTO_PROVIDER: 'local', ...over });
}

describe('parseVersionedKeySpec', () => {
  it('单值 base64:… 解析为版本 1', () => {
    const map = parseVersionedKeySpec(`base64:${K1}`, 'TEST_KEY');
    expect(map.size).toBe(1);
    expect(map.get(1)).toEqual(Buffer.alloc(32, 1));
  });

  it('多版本 1:…,2:… 全部解出，编号最大者为当前版本', () => {
    const map = parseVersionedKeySpec(`1:base64:${K1},2:base64:${K2}`, 'TEST_KEY');
    expect([...map.keys()].sort()).toEqual([1, 2]);
    expect(map.get(2)).toEqual(Buffer.alloc(32, 2));
  });

  it('不合法片段报错（命中：格式错误必须失败）', () => {
    expect(() => parseVersionedKeySpec('not-a-key', 'TEST_KEY')).toThrow(CryptoConfigError);
  });

  it('长度不是 32 字节报错（命中）', () => {
    const short = Buffer.alloc(16, 1).toString('base64');
    expect(() => parseVersionedKeySpec(`base64:${short}`, 'TEST_KEY')).toThrow(/32 字节/);
  });

  it('版本号超出 1–255 报错（命中）', () => {
    expect(() => parseVersionedKeySpec(`0:base64:${K1}`, 'TEST_KEY')).toThrow(CryptoConfigError);
    expect(() => parseVersionedKeySpec(`256:base64:${K1}`, 'TEST_KEY')).toThrow(CryptoConfigError);
  });

  it('版本重复报错（命中）', () => {
    expect(() => parseVersionedKeySpec(`1:base64:${K1},1:base64:${K2}`, 'TEST_KEY')).toThrow(
      /重复/,
    );
  });

  it('空描述报错（命中：未配置密钥不能静默通过）', () => {
    expect(() => parseVersionedKeySpec('  ', 'TEST_KEY')).toThrow(CryptoConfigError);
  });
});

describe('LocalDataKeyProvider（启动策略）', () => {
  it('dev 缺省回退到内置 dev 密钥（版本 1），不抛错', () => {
    const p = new LocalDataKeyProvider(env());
    expect(p.activeVersion()).toBe(1);
    expect(p.keyFor(1)).toEqual(DEV_DATA_KEY);
    expect(p.versions()).toEqual([1]);
  });

  it('dev 显式配置多版本：最大版本为当前加密版本', () => {
    const p = new LocalDataKeyProvider(
      env({ CRYPTO_LOCAL_DATA_KEY: `1:base64:${K1},2:base64:${K2}` }),
    );
    expect(p.activeVersion()).toBe(2);
    expect(p.versions()).toEqual([1, 2]);
  });

  it('staging 缺省：启动即失败（命中：生产环境未配置密钥必须失败）', () => {
    expect(() => new LocalDataKeyProvider(env({ NODE_ENV: 'staging' }))).toThrow(
      /CRYPTO_LOCAL_DATA_KEY/,
    );
  });

  it('production 缺省同样失败（命中）', () => {
    expect(() => new LocalDataKeyProvider(env({ NODE_ENV: 'production' }))).toThrow(
      CryptoConfigError,
    );
  });

  it('staging 显式配置全零 dev 密钥：拒绝（命中：dev 密钥不能进生产）', () => {
    expect(
      () =>
        new LocalDataKeyProvider(
          env({ NODE_ENV: 'staging', CRYPTO_LOCAL_DATA_KEY: `base64:${ZERO}` }),
        ),
    ).toThrow(/dev 密钥/);
  });

  it('test 环境显式全零密钥：放行（不命中：dev/test 允许）', () => {
    const p = new LocalDataKeyProvider(
      env({ NODE_ENV: 'test', CRYPTO_LOCAL_DATA_KEY: `base64:${ZERO}` }),
    );
    expect(p.activeVersion()).toBe(1);
  });

  it('未知版本取密钥抛 EncryptedDataError（命中）', () => {
    const p = new LocalDataKeyProvider(env({ CRYPTO_LOCAL_DATA_KEY: `base64:${K1}` }));
    expect(() => p.keyFor(99)).toThrow(/版本 99/);
  });
});

describe('assertProviderAllowed（提供者与环境组合）', () => {
  it('staging / production 拒绝 local 提供者（命中）', () => {
    expect(() =>
      assertProviderAllowed(env({ NODE_ENV: 'staging', CRYPTO_PROVIDER: 'local' })),
    ).toThrow(/tencent-kms/);
    expect(() =>
      assertProviderAllowed(env({ NODE_ENV: 'production', CRYPTO_PROVIDER: 'local' })),
    ).toThrow(CryptoConfigError);
  });

  it('staging / production 允许 tencent-kms（不命中）', () => {
    expect(() =>
      assertProviderAllowed(env({ NODE_ENV: 'staging', CRYPTO_PROVIDER: 'tencent-kms' })),
    ).not.toThrow();
  });

  it('development 允许 local（不命中）', () => {
    expect(() => assertProviderAllowed(env())).not.toThrow();
  });
});

describe('loadHmacKey', () => {
  it('dev 缺省回退 dev 密钥', () => {
    expect(loadHmacKey(env())).toEqual(DEV_DATA_KEY);
  });

  it('staging 缺省失败（命中）', () => {
    expect(() => loadHmacKey(env({ NODE_ENV: 'staging' }))).toThrow(/CRYPTO_HMAC_KEY/);
  });

  it('staging 全零密钥拒绝（命中）', () => {
    expect(() =>
      loadHmacKey(env({ NODE_ENV: 'staging', CRYPTO_HMAC_KEY: `base64:${ZERO}` })),
    ).toThrow(/dev 密钥/);
  });

  it('合法配置返回 32 字节密钥（不命中）', () => {
    expect(loadHmacKey(env({ CRYPTO_HMAC_KEY: `base64:${K2}` }))).toEqual(Buffer.alloc(32, 2));
  });
});
