import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { REDACT_PATHS } from './logger.module';

/** 防回归：脱敏列表必须覆盖文档要求的最小集合（§2.2、§11.4：手机号、姓名、令牌、健康字段） */
describe('REDACT_PATHS', () => {
  it('覆盖请求头凭证', () => {
    expect(REDACT_PATHS).toContain('req.headers.authorization');
    expect(REDACT_PATHS).toContain('req.headers.cookie');
  });

  it('覆盖手机号与姓名（明文与密文字段）', () => {
    for (const path of ['*.phone', '*.phoneEnc', '*.mobile', '*.realName', '*.nameEnc']) {
      expect(REDACT_PATHS).toContain(path);
    }
  });

  it('覆盖令牌与凭证', () => {
    for (const path of ['*.password', '*.token', '*.accessToken', '*.refreshToken', '*.secret']) {
      expect(REDACT_PATHS).toContain(path);
    }
  });

  it('覆盖健康数据（测评答案、健康字段、聊天原文）', () => {
    for (const path of ['*.answers', '*.answer', '*.answerEnc', '*.healthData', '*.chatContent']) {
      expect(REDACT_PATHS).toContain(path);
    }
  });
});
