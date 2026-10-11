import { describe, expect, it } from 'vitest';
import {
  isWechatApiError,
  toWechatApiError,
  WECHAT_NETWORK_ERROR_CODE,
  WechatApiError,
} from './wechat.errors';

describe('wechat.errors', () => {
  describe('tokenInvalid：命中与不命中', () => {
    it.each([40001, 40014, 42001, 42007, 42009])('errcode %i 判定为令牌失效', (errcode) => {
      expect(new WechatApiError(errcode).tokenInvalid).toBe(true);
    });

    it.each([0, -1, 40003, 43101, 45011])('errcode %i 不判定为令牌失效', (errcode) => {
      expect(new WechatApiError(errcode).tokenInvalid).toBe(false);
    });
  });

  describe('retryable：命中与不命中', () => {
    it.each([-1, 45009, 45011])('errcode %i 可重试', (errcode) => {
      expect(new WechatApiError(errcode).retryable).toBe(true);
    });

    it.each([40001, 40003, 40013, 43101, 47003])('errcode %i 不可重试', (errcode) => {
      expect(new WechatApiError(errcode).retryable).toBe(false);
    });

    it('显式 retryable 覆盖错误码表的判断', () => {
      expect(new WechatApiError(40003, 'x', { retryable: true }).retryable).toBe(true);
      expect(new WechatApiError(-1, 'x', { retryable: false }).retryable).toBe(false);
    });
  });

  describe('错误文案', () => {
    it('优先用微信返回的 errmsg', () => {
      expect(new WechatApiError(40013, 'invalid appid').message).toBe('invalid appid');
      expect(new WechatApiError(40013, 'invalid appid').errmsg).toBe('invalid appid');
    });

    it('没有 errmsg 时回退到登记的中文文案', () => {
      expect(new WechatApiError(42001).message).toBe('微信登录凭证已过期');
    });

    it('未登记的错误码给出带 errcode 的兜底文案，不猜含义', () => {
      expect(new WechatApiError(99999).message).toBe('微信接口错误（errcode=99999）');
    });
  });

  it('保留 HTTP 状态码，便于调用方与监控区分网关错误', () => {
    expect(new WechatApiError(-3, 'x', { httpStatus: 502 }).httpStatus).toBe(502);
  });

  describe('toWechatApiError：异常归一', () => {
    it('已是 WechatApiError 时原样返回', () => {
      const original = new WechatApiError(40001);
      expect(toWechatApiError(original)).toBe(original);
    });

    it('超时 / 中断归一为可重试的网络错误', () => {
      const timeout = new Error('The operation was aborted due to timeout');
      timeout.name = 'TimeoutError';

      const normalized = toWechatApiError(timeout);
      expect(normalized.errcode).toBe(WECHAT_NETWORK_ERROR_CODE);
      expect(normalized.retryable).toBe(true);
      expect(normalized.message).toBe('请求微信接口超时');
    });

    it('网络错误消息里不带请求 URL（微信 query 含 secret，不能进日志）', () => {
      const failure = new Error('ECONNRESET');

      const normalized = toWechatApiError(failure);
      expect(normalized.errcode).toBe(WECHAT_NETWORK_ERROR_CODE);
      expect(normalized.retryable).toBe(true);
      expect(normalized.message).toContain('ECONNRESET');
      expect(normalized.message).not.toContain('http');
    });

    it('非 Error 的抛出物也能归一', () => {
      const normalized = toWechatApiError('boom');
      expect(normalized.errcode).toBe(WECHAT_NETWORK_ERROR_CODE);
      expect(normalized.message).toContain('boom');
    });
  });

  it('isWechatApiError 类型守卫', () => {
    expect(isWechatApiError(new WechatApiError(0))).toBe(true);
    expect(isWechatApiError(new Error('x'))).toBe(false);
    expect(isWechatApiError(undefined)).toBe(false);
  });
});
