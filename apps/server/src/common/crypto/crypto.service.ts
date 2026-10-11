import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { EncryptedDataError } from './crypto.errors';
// 注意：DataKeyProvider 是 DI token，必须值导入（import type 会被擦除导致元数据丢失）
import { DataKeyProvider } from './keys';

/** 密文格式：版本号(1B) + 随机数(12B) + AES-256-GCM 密文 + 认证标签(16B)（§11.4） */
export const ENC_VERSION_BYTES = 1;
export const ENC_NONCE_BYTES = 12;
export const ENC_TAG_BYTES = 16;
const ENC_MIN_BYTES = ENC_VERSION_BYTES + ENC_NONCE_BYTES + ENC_TAG_BYTES;

/**
 * 字段加密：业务代码只接触明文字符串，落库前由 Prisma 扩展调用本服务加密（§11.4、§13.5）。
 * 加密永远使用当前版本（多版本并存时的最大版本）；解密按密文头部版本号取密钥，支持密钥轮换。
 */
@Injectable()
export class CryptoService implements OnModuleInit {
  constructor(private readonly dataKeys: DataKeyProvider) {}

  /** 启动时初始化密钥提供者（KMS 提供者在此完成网络解密），失败即启动失败 */
  async onModuleInit(): Promise<void> {
    await this.dataKeys.init();
  }

  /** 加密明文（UTF-8 字符串），返回带版本号的二进制密文 */
  encrypt(plaintext: string): Uint8Array {
    const version = this.dataKeys.activeVersion();
    const key = this.dataKeys.keyFor(version);
    const nonce = randomBytes(ENC_NONCE_BYTES);
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return new Uint8Array(
      Buffer.concat([Buffer.from([version]), nonce, ciphertext, cipher.getAuthTag()]),
    );
  }

  /** 解密带版本号的二进制密文；被篡改、标签不匹配或版本未知时抛 EncryptedDataError */
  decrypt(data: Uint8Array): string {
    if (data.length < ENC_MIN_BYTES) {
      throw new EncryptedDataError(
        `密文长度 ${data.length} 字节，不满足最小格式 ${ENC_MIN_BYTES} 字节`,
      );
    }
    const view = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const version = view[0] ?? 0;
    if (version < 1) throw new EncryptedDataError('密文版本号非法');
    const key = this.dataKeys.keyFor(version);
    const nonce = view.subarray(ENC_VERSION_BYTES, ENC_VERSION_BYTES + ENC_NONCE_BYTES);
    const tag = view.subarray(view.length - ENC_TAG_BYTES);
    const ciphertext = view.subarray(
      ENC_VERSION_BYTES + ENC_NONCE_BYTES,
      view.length - ENC_TAG_BYTES,
    );
    try {
      const decipher = createDecipheriv('aes-256-gcm', key, nonce);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
      throw new EncryptedDataError('密文被篡改、密钥不匹配或认证标签校验失败');
    }
  }
}
