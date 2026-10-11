import { Module } from '@nestjs/common';

/**
 * 体检券、医疗服务目录、体检套餐、号源
 * 文档：§4.9、§6.2.12、§11.3.10
 * 拥有的表：prisma/schema/checkup.prisma：medical_service, checkup_package, checkup_slot, checkup_coupon
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class CheckupModule {}
