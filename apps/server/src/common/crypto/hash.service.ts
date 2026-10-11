import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';

/**
 * 查找哈希（§11.1、§13.5）：加密字段不可直接按值查询，落库时同时写入独立 HMAC 密钥
 * 计算的 *_hash 列（CHAR(64)，64 位十六进制 HMAC-SHA256）。
 * HMAC 密钥与数据密钥相互独立，即使数据密钥轮换，*_hash 仍保持稳定可查。
 */
@Injectable()
export class HashService {
  constructor(private readonly hmacKey: Buffer) {}

  /** 任意值的 HMAC-SHA256（64 位十六进制小写） */
  hmac(value: string): string {
    return createHmac('sha256', this.hmacKey).update(value, 'utf8').digest('hex');
  }

  /**
   * 手机号规范化：去首尾与中间空白（含全角空格）与连字符；
   * 仅当去掉 +86 / 86 前缀后剩下 11 位大陆手机号（1 开头）时才去前缀，其它形式保持原样。
   */
  normalizePhone(phone: string): string {
    const compact = phone.replace(/[\s\-\u2010-\u2015]/g, '');
    return compact.replace(/^\+?86(?=1\d{10}$)/, '');
  }

  /** 手机号查找哈希：先规范化再 HMAC，保证 "+86 138…" 与 "138…" 命中同一记录 */
  phoneHash(phone: string): string {
    return this.hmac(this.normalizePhone(phone));
  }
}
