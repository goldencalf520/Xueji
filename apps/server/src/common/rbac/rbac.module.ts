import { Global, Module } from '@nestjs/common';

/**
 * 权限与数据范围：@Permission() 守卫、数据范围（all / store / self）注入、医院端强制 hospital_id（§2.2、§13.5）
 *
 * 占位：已在 CommonModule 注册，由「SRV-05 RBAC 与数据范围」issue 在本目录内实现（见 docs/architecture/ownership.md）。
 * 全局守卫 / 拦截器在本模块的 providers 中以 APP_GUARD / APP_INTERCEPTOR 注册。
 */
@Global()
@Module({})
export class RbacModule {}
