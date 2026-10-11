import { Module } from '@nestjs/common';

/**
 * 线索（文旅、海外 VIP、接送等意向）
 * 文档：§6.2.14、§9.6、§11.3.10
 * 拥有的表：prisma/schema/lead.prisma：lead, lead_followup
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class LeadModule {}
