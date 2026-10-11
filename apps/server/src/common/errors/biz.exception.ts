import { ErrorCode, ErrorMessage } from '@xueji/shared';

/**
 * 业务异常：服务层统一抛这个，由 AllExceptionsFilter 转成 §12.1 的响应信封。
 *
 * @example
 *   throw new BizException(ErrorCode.CONFLICT, '体检券已核销');
 *   throw BizException.consentRequired('C2');
 */
export class BizException extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly data: unknown = null,
  ) {
    super(message ?? ErrorMessage[code]);
    this.name = 'BizException';
  }

  static notFound(message?: string) {
    return new BizException(ErrorCode.NOT_FOUND, message);
  }

  static forbidden(message?: string) {
    return new BizException(ErrorCode.FORBIDDEN, message);
  }

  static conflict(message?: string) {
    return new BizException(ErrorCode.CONFLICT, message);
  }

  /** 缺少授权（40010），前端据 consentType 跳转对应授权页 */
  static consentRequired(consentType: string, scope?: Record<string, unknown>) {
    return new BizException(ErrorCode.CONSENT_REQUIRED, undefined, { consentType, scope });
  }
}

/** 业务错误码 → HTTP 状态码。客户端以响应体 code 为准，HTTP 状态码便于网关和监控统计 */
export const HTTP_STATUS_OF: Record<ErrorCode, number> = {
  [ErrorCode.OK]: 200,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.CONSENT_REQUIRED]: 403,
  [ErrorCode.PHONE_REQUIRED]: 403,
  [ErrorCode.INVALID_PARAMS]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.INTERNAL]: 500,
  [ErrorCode.AI_UNAVAILABLE]: 503,
};
