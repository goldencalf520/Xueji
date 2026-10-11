import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'xueji:rate-limit';

/** @RateLimit 参数（§14.2） */
export interface RateLimitOptions {
  /** 限流主体：'ip' 按客户端 IP；'user' 按登录用户（未登录回退 IP） */
  key: 'ip' | 'user';
  /** 窗口内允许的请求总数 */
  limit: number;
  /** 滑动窗口长度（秒） */
  windowSec: number;
}

/** 路由级限流：超限返回 42900（ErrorCode.TOO_MANY_REQUESTS） */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
