/**
 * 微信错误码映射（SRV-10 / #29）。
 *
 * 只登记本项目会遇到的错误码，未登记的一律回退到微信返回的 `errmsg`，**不猜**。
 * 两类需要调用方感知的语义：
 * - `tokenInvalid`：access_token 失效 / 过期 → 刷新令牌后重试一次（由 WechatRealClient 自动完成）；
 * - `retryable`：微信侧临时故障、频率限制或网络异常 → 可退避重试。
 */

/** access_token 无效 / 已过期：强制刷新后重试一次 */
export const WECHAT_TOKEN_INVALID_CODES: readonly number[] = [40001, 40014, 42001, 42007, 42009];

/** 微信侧临时故障或频率限制：可退避重试 */
export const WECHAT_RETRYABLE_CODES: readonly number[] = [-1, 45009, 45011];

/** 本地错误码：微信自身的错误码均 ≥ -1，用负数表示“请求没能拿到微信的业务应答” */
export const WECHAT_NETWORK_ERROR_CODE = -2;
export const WECHAT_UNEXPECTED_RESPONSE_CODE = -3;

/** 常见错误码的中文文案（回退用；未登记的错误码直接用微信的 errmsg） */
export const WECHAT_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  [-1]: '微信服务繁忙，请稍后再试',
  [WECHAT_NETWORK_ERROR_CODE]: '连接微信服务失败',
  [WECHAT_UNEXPECTED_RESPONSE_CODE]: '微信返回了无法识别的内容',
  40001: '微信登录凭证已失效',
  40003: '微信用户标识无效',
  40013: '微信 AppID 无效',
  40014: '微信登录凭证已失效',
  40037: '订阅消息模板 ID 不合法',
  41030: '小程序页面不存在',
  42001: '微信登录凭证已过期',
  43101: '用户未订阅该消息',
  45009: '微信接口调用超过配额',
  45011: '微信接口调用过于频繁',
  47003: '订阅消息内容不合法',
};

export interface WechatApiErrorOptions {
  httpStatus?: number;
  /** 显式指定是否可重试；不传则按错误码表判断 */
  retryable?: boolean;
}

/** 微信接口错误。`errcode` 为负数是本地产生的错误（网络 / 超时 / 非 JSON 响应） */
export class WechatApiError extends Error {
  readonly errcode: number;
  readonly errmsg: string;
  readonly httpStatus?: number;
  private readonly explicitRetryable?: boolean;

  constructor(errcode: number, errmsg?: string, options: WechatApiErrorOptions = {}) {
    const message =
      errmsg || WECHAT_ERROR_MESSAGES[errcode] || `微信接口错误（errcode=${String(errcode)}）`;
    super(message);
    this.name = 'WechatApiError';
    this.errcode = errcode;
    this.errmsg = errmsg ?? '';
    this.httpStatus = options.httpStatus;
    this.explicitRetryable = options.retryable;
  }

  /** access_token 失效：刷新令牌后重试一次即可恢复 */
  get tokenInvalid(): boolean {
    return WECHAT_TOKEN_INVALID_CODES.includes(this.errcode);
  }

  get retryable(): boolean {
    return this.explicitRetryable ?? WECHAT_RETRYABLE_CODES.includes(this.errcode);
  }
}

export function isWechatApiError(value: unknown): value is WechatApiError {
  return value instanceof WechatApiError;
}

/**
 * 把任意异常归一成 WechatApiError：超时 / 网络失败都是「可重试」，
 * 且消息里**不带请求 URL**（微信接口的 query 含 appid / secret，不能进日志与错误信息）。
 */
export function toWechatApiError(error: unknown): WechatApiError {
  if (error instanceof WechatApiError) return error;
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return new WechatApiError(WECHAT_NETWORK_ERROR_CODE, '请求微信接口超时', { retryable: true });
  }
  const detail = error instanceof Error ? error.message : String(error);
  return new WechatApiError(WECHAT_NETWORK_ERROR_CODE, `请求微信接口失败：${detail}`, {
    retryable: true,
  });
}
