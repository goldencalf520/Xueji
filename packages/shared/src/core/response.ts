/**
 * 统一响应信封与错误码（文档 §12.1）。
 * 三端（小程序 / 管理端 / 医院端）与服务端共用，修改须走架构评审。
 */

export const ErrorCode = {
  /** 成功 */
  OK: 0,
  /** 未登录或令牌过期：刷新令牌，失败则重新登录 */
  UNAUTHORIZED: 40001,
  /** 无权限 */
  FORBIDDEN: 40003,
  /** 需要授权：响应 data 中带 consentType，前端跳转对应授权页 */
  CONSENT_REQUIRED: 40010,
  /** 需要绑定手机号 */
  PHONE_REQUIRED: 40011,
  /** 参数错误：data.fieldErrors 带字段级错误 */
  INVALID_PARAMS: 40020,
  /** 资源不存在 */
  NOT_FOUND: 40400,
  /** 状态冲突（如体检券已核销） */
  CONFLICT: 40900,
  /** 请求过于频繁 */
  TOO_MANY_REQUESTS: 42900,
  /** 服务器错误 */
  INTERNAL: 50000,
  /** AI 服务暂不可用 */
  AI_UNAVAILABLE: 50301,
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 错误码默认文案（面向前台展示，乐龄友好：说明发生了什么、怎么办） */
export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.OK]: 'ok',
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '没有权限',
  [ErrorCode.CONSENT_REQUIRED]: '需要您先同意相关授权',
  [ErrorCode.PHONE_REQUIRED]: '请先验证手机号',
  [ErrorCode.INVALID_PARAMS]: '填写的内容有误，请检查后再试',
  [ErrorCode.NOT_FOUND]: '内容不存在或已删除',
  [ErrorCode.CONFLICT]: '状态已变化，请刷新后再试',
  [ErrorCode.TOO_MANY_REQUESTS]: '操作太频繁了，请稍后再试',
  [ErrorCode.INTERNAL]: '网络不太好，请稍后再试',
  [ErrorCode.AI_UNAVAILABLE]: '我现在有点忙，稍后再聊',
};

/** 统一响应信封：{ code, message, data, requestId } */
export interface ApiResponse<T = unknown> {
  code: ErrorCode;
  message: string;
  data: T;
  requestId: string;
}

/** 40010 时 data 的形状 */
export interface ConsentRequiredData {
  consentType: string;
  scope?: Record<string, unknown>;
}

/** 40020 时 data 的形状 */
export interface InvalidParamsData {
  fieldErrors: Record<string, string[]>;
}

/** 游标分页：请求 `?cursor=…&limit=20`，返回 nextCursor（null 表示没有更多） */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

/** 创建类接口支持的幂等请求头（§12.1），24 小时内重复请求返回首次结果 */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
export const REQUEST_ID_HEADER = 'X-Request-Id';

/** 三端 API 前缀（§12.1） */
export const API_PREFIX = {
  app: '/api/v1/app',
  admin: '/api/v1/admin',
  hospital: '/api/v1/hospital',
  webhook: '/api/v1/webhook',
} as const;
