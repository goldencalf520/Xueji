import { Global, Module } from '@nestjs/common';

/**
 * 审计：@Audit() 装饰器与拦截器，成功后写 audit_log（§11.3.14、§13.5）
 *
 * 占位：已在 CommonModule 注册，由「SRV-06 审计日志」issue 在本目录内实现（见 docs/architecture/ownership.md）。
 * 全局守卫 / 拦截器在本模块的 providers 中以 APP_GUARD / APP_INTERCEPTOR 注册。
 */
@Global()
@Module({})
export class AuditCoreModule {}
