import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { HashService } from './hash.service';

describe('HashService', () => {
  it('hmac 输出 64 位十六进制且稳定（同一密钥同一输入）', () => {
    const hash = new HashService(Buffer.alloc(32, 9));
    const a = hash.hmac('13812345678');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(hash.hmac('13812345678')).toBe(a);
  });

  it('不同输入哈希不同（不命中：不能碰撞成同一查找值）', () => {
    const hash = new HashService(Buffer.alloc(32, 9));
    expect(hash.hmac('13812345678')).not.toBe(hash.hmac('13812345679'));
  });

  it('不同 HMAC 密钥对同一手机号得到不同哈希（密钥独立性）', () => {
    expect(new HashService(Buffer.alloc(32, 9)).hmac('13812345678')).not.toBe(
      new HashService(Buffer.alloc(32, 8)).hmac('13812345678'),
    );
  });

  describe('normalizePhone（去空格、去 +86）', () => {
    const hash = new HashService(Buffer.alloc(32, 9));

    it('各种等价写法规范化为同一 11 位手机号（命中：查找不漏）', () => {
      expect(hash.normalizePhone('13812345678')).toBe('13812345678');
      expect(hash.normalizePhone(' 13812345678 ')).toBe('13812345678');
      expect(hash.normalizePhone('138 1234 5678')).toBe('13812345678');
      expect(hash.normalizePhone('138-1234-5678')).toBe('13812345678');
      expect(hash.normalizePhone('+8613812345678')).toBe('13812345678');
      expect(hash.normalizePhone('8613812345678')).toBe('13812345678');
      expect(hash.normalizePhone('+86 138 1234 5678')).toBe('13812345678');
      expect(hash.normalizePhone('+86-13812345678')).toBe('13812345678');
    });

    it('全角空格也被去除', () => {
      expect(hash.normalizePhone('138\u30001234 5678')).toBe('13812345678');
    });

    it('非 11 位手机号的 +86 前缀保持原样（不命中：不能误伤其它号码）', () => {
      expect(hash.normalizePhone('+860201234567')).toBe('+860201234567');
      expect(hash.normalizePhone('020-1234-5678')).toBe('02012345678');
      expect(hash.normalizePhone('12345')).toBe('12345');
    });
  });

  it('phoneHash：等价写法命中同一哈希，不同号码不同（查找哈希的核心约定）', () => {
    const hash = new HashService(Buffer.alloc(32, 9));
    const target = hash.phoneHash('13812345678');
    expect(hash.phoneHash('+86 138 1234 5678')).toBe(target);
    expect(hash.phoneHash('138-1234-5678')).toBe(target);
    expect(hash.phoneHash('13812345679')).not.toBe(target);
  });
});
