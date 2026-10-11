import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AntiReplayGuard } from './anti-replay.guard';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * 接口防护：Idempotency-Key 幂等、限流（IP / 用户）、防重放（时间戳 + 随机数）、游标分页工具（§12.1、§14.2）
 *
 * 全局注册（执行顺序 = 注册顺序）：
 *   RateLimitGuard   → 先限流，保护 Redis 与后端不被刷；
 *   AntiReplayGuard  → 再防重放（只作用于 @AntiReplay() 的路由）；
 *   IdempotencyInterceptor 在守卫之后、EnvelopeInterceptor 内层，
 *   缓存与回放的都是业务原始值，由 EnvelopeInterceptor 统一包装（不双重包装）。
 * 游标分页（encodeCursor / decodeCursor / paginate）是纯工具，不需要注册。
 */
@Global()
@Module({
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: AntiReplayGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class HttpExtrasModule {}
