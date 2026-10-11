import { Module } from '@nestjs/common';

/**
 * 管理端客户列表、详情、分配、跟进记录
 * 文档：§6.2.3、§12.3
 * 拥有的表：prisma/schema/customer-admin.prisma：customer_summary, customer_followup
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#50（CUS-02）。
 */
@Module({})
export class CustomerAdminModule {}
