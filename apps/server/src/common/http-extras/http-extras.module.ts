import { Global, Module } from '@nestjs/common';

/**
 * 接口防护：Idempotency-Key 幂等、限流（IP / 用户）、防重放（时间戳 + 随机数）、游标分页工具（§12.1、§14.2）
 *
 * 占位：已在 CommonModule 注册，由「SRV-01 接口防护」issue 在本目录内实现（见 docs/architecture/ownership.md）。
 * 全局守卫 / 拦截器在本模块的 providers 中以 APP_GUARD / APP_INTERCEPTOR 注册。
 */
@Global()
@Module({})
export class HttpExtrasModule {}
