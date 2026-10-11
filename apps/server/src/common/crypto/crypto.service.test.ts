import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { EncryptedDataError } from './crypto.errors';
import {
  CryptoService,
  ENC_MIN_BYTES,
  ENC_NONCE_BYTES,
  ENC_TAG_BYTES,
  ENC_VERSION_BYTES,
} from './crypto.service';
import { DataKeyProvider } from './keys';

/** 测试用密钥提供者：直接持有 版本号 → 密钥 映射 */
class FakeProvider extends DataKeyProvider {
  initCalls = 0;

  constructor(private readonly keys: Map<number, Buffer>) {
    super();
  }

  override async init(): Promise<void> {
    this.initCalls++;
  }

  override keyFor(version: number): Buffer {
    const key = this.keys.get(version);
    if (!key) throw new EncryptedDataError(`没有版本 ${version} 的密钥`);
    return key;
  }

  override activeVersion(): number {
    return Math.max(...this.keys.keys());
  }

  override versions(): number[] {
    return [...this.keys.keys()].sort((a, b) => a - b);
  }
}

const KEY_V1 = Buffer.alloc(32, 1);
const KEY_V2 = Buffer.alloc(32, 2);

describe('CryptoService（AES-256-GCM）', () => {
  it('加解密往返（不命中：正常数据必须无损还原）', () => {
    const svc = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    for (const plaintext of ['13812345678', '张三', '敏感答案 A1', '😊 emoji', '']) {
      expect(svc.decrypt(svc.encrypt(plaintext))).toBe(plaintext);
    }
  });

  it('密文格式：版本号(1B) + 随机数(12B) + 密文 + 认证标签(16B)', () => {
    const svc = new CryptoService(new FakeProvider(new Map([[7, KEY_V1]])));
    const data = svc.encrypt('hello');
    expect(data[0]).toBe(7); // 版本号
    expect(data.length).toBe(
      ENC_VERSION_BYTES + ENC_NONCE_BYTES + Buffer.byteLength('hello') + ENC_TAG_BYTES,
    );
  });

  it('同一明文两次加密因随机数不同而密文不同（语义安全）', () => {
    const svc = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    expect(svc.encrypt('same')).not.toEqual(svc.encrypt('same'));
  });

  it('密文被篡改：解密失败（命中：认证标签校验）', () => {
    const svc = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    const data = svc.encrypt('secret');
    data[data.length - 1] ^= 0xff; // 破坏认证标签
    expect(() => svc.decrypt(data)).toThrow(EncryptedDataError);
  });

  it('密文中间字节被篡改同样失败（命中）', () => {
    const svc = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    const data = svc.encrypt('secret');
    data[ENC_VERSION_BYTES + ENC_NONCE_BYTES + 1] ^= 0xff; // 破坏密文体
    expect(() => svc.decrypt(data)).toThrow(EncryptedDataError);
  });

  it('密钥不匹配：解密失败（命中）', () => {
    const a = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    const b = new CryptoService(new FakeProvider(new Map([[1, KEY_V2]])));
    expect(() => b.decrypt(a.encrypt('secret'))).toThrow(EncryptedDataError);
  });

  it('密文过短：明确报错（命中）', () => {
    const svc = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    expect(() => svc.decrypt(new Uint8Array(ENC_MIN_BYTES - 1))).toThrow(/长度/);
  });

  it('版本号 0：拒绝（命中）', () => {
    const svc = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    const data = svc.encrypt('secret');
    data[0] = 0;
    expect(() => svc.decrypt(data)).toThrow(EncryptedDataError);
  });

  it('多版本密钥：新数据用最大版本加密，旧版本密文仍可解（命中轮换并存）', () => {
    const svcOld = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    const oldBlob = svcOld.encrypt('历史数据');

    const svc = new CryptoService(
      new FakeProvider(
        new Map([
          [1, KEY_V1],
          [2, KEY_V2],
        ]),
      ),
    );
    const fresh = svc.encrypt('新数据');
    expect(fresh[0]).toBe(2); // 当前加密版本 = 最大版本
    expect(svc.decrypt(fresh)).toBe('新数据');
    expect(svc.decrypt(oldBlob)).toBe('历史数据'); // 旧版本密文按旧密钥解
  });

  it('未知版本密文：解密失败（命中：删掉旧密钥后旧数据必须报错而不是返回垃圾）', () => {
    const svcOld = new CryptoService(new FakeProvider(new Map([[1, KEY_V1]])));
    const oldBlob = svcOld.encrypt('历史数据');
    const svcNew = new CryptoService(new FakeProvider(new Map([[2, KEY_V2]])));
    expect(() => svcNew.decrypt(oldBlob)).toThrow(EncryptedDataError);
  });

  it('onModuleInit 调用提供者 init（启动即校验）', async () => {
    const provider = new FakeProvider(new Map([[1, KEY_V1]]));
    await new CryptoService(provider).onModuleInit();
    expect(provider.initCalls).toBe(1);
  });
});
