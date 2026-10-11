import { Global, Module } from '@nestjs/common';

/**
 * 令牌与鉴权：JWT（app / admin / hospital 三种 aud）、刷新令牌、全局 AuthGuard、@Public()、@CurrentUser()（§12.1、§13.5）
 *
 * 占位：已在 CommonModule 注册，由「SRV-03 令牌与鉴权」issue 在本目录内实现（见 docs/architecture/ownership.md）。
 * 全局守卫 / 拦截器在本模块的 providers 中以 APP_GUARD / APP_INTERCEPTOR 注册。
 */
@Global()
@Module({})
export class AuthCoreModule {}
