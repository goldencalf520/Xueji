import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthConfig } from './auth.config';
import { AuthGuard } from './auth.guard';
import { TokenService } from './token.service';
import { TokenFamilyStore } from './token-family.store';

/**
 * 令牌与鉴权：JWT 三端隔离（app / admin / hospital）、刷新令牌轮换与重放检测、
 * 全局 AuthGuard、@Public() / @RequirePhone() / @CurrentUser()（SRV-03，§12.1、§13.5、§6.2.1）
 *
 * 全局 AuthGuard 以 APP_GUARD 注册（先鉴权，rbac 的 PermissionGuard 在其后）。
 * 业务模块登录成功后注入 TokenService 签发 / 轮换 / 吊销令牌。
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [
    { provide: AuthConfig, useFactory: () => new AuthConfig() },
    TokenFamilyStore,
    TokenService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthConfig, TokenFamilyStore, TokenService],
})
export class AuthCoreModule {}
