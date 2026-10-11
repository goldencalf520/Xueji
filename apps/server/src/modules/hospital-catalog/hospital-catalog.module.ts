import { Module } from '@nestjs/common';

/**
 * 医院端号源、服务与套餐变更、本院账号
 * 文档：§7.5、§7.6、§7.8
 * 拥有的表：prisma/schema/hospital-catalog.prisma：hospital_service_change
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class HospitalCatalogModule {}
