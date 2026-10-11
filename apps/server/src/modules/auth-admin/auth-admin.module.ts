import { Module } from '@nestjs/common';

/**
 * 管理端 / 移动工作台登录
 * 文档：§6.2.1、§6.3、§12.3
 * 拥有的表：prisma/schema/auth-admin.prisma：staff_login_log
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class AuthAdminModule {}
