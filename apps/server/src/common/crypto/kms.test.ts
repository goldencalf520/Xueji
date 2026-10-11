import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { loadCryptoEnv } from './crypto.config';
import { CryptoConfigError, EncryptedDataError } from './crypto.errors';
import { KMS_API_VERSION, kmsDecrypt, TencentKmsDataKeyProvider, tc3Authorization } from './kms';

const SECRET_ID = 'AKIDtestsecretid';
const SECRET_KEY = 'testsecretkey';
const BLOB_V1 = Buffer.from('kms-blob-v1').toString('base64');
const BLOB_V2 = Buffer.from('kms-blob-v2').toString('base64');
const PLAIN_V1 = Buffer.alloc(32, 1).toString('base64');
const PLAIN_V2 = Buffer.alloc(32, 2).toString('base64');

function kmsEnv(over: Record<string, string> = {}) {
  return loadCryptoEnv({
    NODE_ENV: 'production',
    CRYPTO_PROVIDER: 'tencent-kms',
    TENCENT_KMS_REGION: 'ap-guangzhou',
    TENCENT_SECRET_ID: SECRET_ID,
    TENCENT_SECRET_KEY: SECRET_KEY,
    TENCENT_KMS_ENCRYPTED_DATA_KEY: BLOB_V1,
    ...over,
  });
}

describe('tc3Authorization（API 3.0 签名）', () => {
  const base = {
    host: 'kms.ap-guangzhou.tencentcloudapi.com',
    service: 'kms',
    secretId: SECRET_ID,
    secretKey: SECRET_KEY,
    action: 'Decrypt',
    payload: '{"CiphertextBlob":"abc"}',
    timestampSec: 1_700_000_000,
  };

  it('输出符合 TC3-HMAC-SHA256 结构', () => {
    const { authorization } = tc3Authorization(base);
    expect(authorization).toMatch(
      /^TC3-HMAC-SHA256 Credential=AKIDtestsecretid\/2023-11-14\/kms\/tc3_request, SignedHeaders=content-type;host;x-tc-action, Signature=[0-9a-f]{64}$/,
    );
  });

  it('同输入签名确定，不同输入签名不同', () => {
    const a = tc3Authorization(base).authorization;
    expect(tc3Authorization(base).authorization).toBe(a);
    expect(
      tc3Authorization({ ...base, payload: '{"CiphertextBlob":"xyz"}' }).authorization,
    ).not.toBe(a);
    expect(
      tc3Authorization({ ...base, timestampSec: base.timestampSec + 1 }).authorization,
    ).not.toBe(a);
    expect(tc3Authorization({ ...base, secretKey: 'other' }).authorization).not.toBe(a);
  });
});

describe('kmsDecrypt', () => {
  it('成功：返回 Plaintext，请求头与请求体符合 API 3.0 约定', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ Response: { Plaintext: PLAIN_V1, RequestId: 'r-1' } }), {
          status: 200,
        }),
    );
    const plaintext = await kmsDecrypt({
      region: 'ap-guangzhou',
      secretId: SECRET_ID,
      secretKey: SECRET_KEY,
      ciphertextBlob: 'blob',
      timestampSec: 1_700_000_000,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(plaintext).toBe(PLAIN_V1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://kms.ap-guangzhou.tencentcloudapi.com/');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-TC-Action']).toBe('Decrypt');
    expect(headers['X-TC-Version']).toBe(KMS_API_VERSION);
    expect(headers['X-TC-Region']).toBe('ap-guangzhou');
    expect(headers['X-TC-Timestamp']).toBe('1700000000');
    expect(headers.Authorization).toMatch(/^TC3-HMAC-SHA256 Credential=/);
    expect(JSON.parse(String(init.body))).toEqual({ CiphertextBlob: 'blob' });
  });

  it('KMS 业务错误：抛 CryptoConfigError 并带错误码（命中）', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            Response: { Error: { Code: 'InvalidCiphertext', Message: '密文不合法' } },
          }),
          {
            status: 200,
          },
        ),
    );
    await expect(
      kmsDecrypt({
        region: 'ap-guangzhou',
        secretId: SECRET_ID,
        secretKey: SECRET_KEY,
        ciphertextBlob: 'bad',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/InvalidCiphertext/);
  });

  it('HTTP 非 2xx：抛错（命中）', async () => {
    const fetchImpl = vi.fn(async () => new Response('gateway timeout', { status: 504 }));
    await expect(
      kmsDecrypt({
        region: 'ap-guangzhou',
        secretId: SECRET_ID,
        secretKey: SECRET_KEY,
        ciphertextBlob: 'x',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/504/);
  });

  it('响应缺少 Plaintext：抛错（命中）', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ Response: {} }), { status: 200 }),
    );
    await expect(
      kmsDecrypt({
        region: 'ap-guangzhou',
        secretId: SECRET_ID,
        secretKey: SECRET_KEY,
        ciphertextBlob: 'x',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/Plaintext/);
  });
});

describe('TencentKmsDataKeyProvider', () => {
  it('缺少必要配置：构造即失败（命中：不能带着空配置启动）', () => {
    expect(() => new TencentKmsDataKeyProvider(kmsEnv({ TENCENT_KMS_REGION: '' }))).toThrow(
      /TENCENT_KMS_REGION/,
    );
    expect(() => new TencentKmsDataKeyProvider(kmsEnv({ TENCENT_SECRET_ID: '' }))).toThrow(
      /TENCENT_SECRET_ID/,
    );
    expect(() => new TencentKmsDataKeyProvider(kmsEnv({ TENCENT_SECRET_KEY: '' }))).toThrow(
      /TENCENT_SECRET_ID/,
    );
    expect(
      () => new TencentKmsDataKeyProvider(kmsEnv({ TENCENT_KMS_ENCRYPTED_DATA_KEY: '' })),
    ).toThrow(/TENCENT_KMS_ENCRYPTED_DATA_KEY/);
  });

  it('单 blob 解析为版本 1；多版本 blob 用编号区分', async () => {
    const decrypt = vi.fn(async () => PLAIN_V1);
    const single = new TencentKmsDataKeyProvider(kmsEnv(), { decrypt });
    await single.init();
    expect(single.activeVersion()).toBe(1);
    expect(decrypt).toHaveBeenCalledTimes(1);

    const multi = new TencentKmsDataKeyProvider(
      kmsEnv({ TENCENT_KMS_ENCRYPTED_DATA_KEY: `1:${BLOB_V1},2:${BLOB_V2}` }),
      {
        decrypt: vi.fn(async ({ ciphertextBlob }) =>
          ciphertextBlob === BLOB_V2 ? PLAIN_V2 : PLAIN_V1,
        ),
      },
    );
    await multi.init();
    expect(multi.activeVersion()).toBe(2);
    expect(multi.versions()).toEqual([1, 2]);
  });

  it('init 失败：抛错（命中：KMS 不可用时启动失败）', async () => {
    const provider = new TencentKmsDataKeyProvider(kmsEnv(), {
      decrypt: vi.fn(async () => {
        throw new CryptoConfigError('KMS Decrypt 失败：AuthFailure');
      }),
    });
    await expect(provider.init()).rejects.toThrow(/AuthFailure/);
  });

  it('解出的密钥不是 32 字节：失败（命中）', async () => {
    const provider = new TencentKmsDataKeyProvider(kmsEnv(), {
      decrypt: vi.fn(async () => Buffer.alloc(16, 1).toString('base64')),
    });
    await expect(provider.init()).rejects.toThrow(/32 字节/);
  });

  it('init 前取密钥 / 未知版本：抛 EncryptedDataError（命中）', async () => {
    const provider = new TencentKmsDataKeyProvider(kmsEnv(), {
      decrypt: vi.fn(async () => PLAIN_V1),
    });
    expect(() => provider.keyFor(1)).toThrow(EncryptedDataError);
    await provider.init();
    expect(() => provider.keyFor(99)).toThrow(EncryptedDataError);
  });

  it('loadedFingerprints 只输出指纹不泄露密钥', async () => {
    const provider = new TencentKmsDataKeyProvider(kmsEnv(), {
      decrypt: vi.fn(async () => PLAIN_V1),
    });
    await provider.init();
    const fp = provider.loadedFingerprints();
    expect(fp[1]).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.stringify(fp)).not.toContain(PLAIN_V1);
  });
});
