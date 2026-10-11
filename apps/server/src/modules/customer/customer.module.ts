import { Module } from '@nestjs/common';

/**
 * 客户核心：客户、运营标签、小程序码、健康标签
 * 文档：§11.3.2
 * 拥有的表：prisma/schema/customer.prisma：customer, customer_label, qrcode, h_health_tag
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#36（CUS-01）。
 */
@Module({})
export class CustomerModule {}
