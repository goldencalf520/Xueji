import { Module } from '@nestjs/common';

/**
 * 转介单（管理端）：创建、快照、状态流转、取消、催办
 * 文档：§6.2.13、§7.2、§11.3.10
 * 拥有的表：prisma/schema/referral.prisma：h_referral, h_referral_return
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class ReferralModule {}
