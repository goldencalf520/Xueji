import { describe, expect, it } from 'vitest';
import { ErrorCode, ErrorMessage } from './response';

describe('ErrorCode', () => {
  it('每个错误码都有默认文案', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(ErrorMessage[code]).toBeTruthy();
    }
  });

  it('错误码与文档 §12.1 一致', () => {
    expect(ErrorCode.CONSENT_REQUIRED).toBe(40010);
    expect(ErrorCode.AI_UNAVAILABLE).toBe(50301);
  });
});
