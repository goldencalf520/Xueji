import { Module } from '@nestjs/common';

/**
 * 合作方：医院、医院账号、旅行社 / 机构及资质
 * 文档：§6.2.16、§11.3.1
 * 拥有的表：prisma/schema/partner.prisma：hospital, hospital_user, partner
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class PartnerModule {}
