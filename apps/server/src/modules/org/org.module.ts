import { Module } from '@nestjs/common';

/**
 * 组织与账号：门店、员工、角色、权限码、数据范围
 * 文档：§2.2、§6.2.19、§11.3.1
 * 拥有的表：prisma/schema/org.prisma：store, staff, role, permission, staff_role, role_permission
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class OrgModule {}
