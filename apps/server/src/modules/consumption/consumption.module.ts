import { Module } from '@nestjs/common';

/**
 * 收银消费流水导入
 * 文档：§6.2.20、§11.3.4
 * 拥有的表：prisma/schema/consumption.prisma：consumption, import_batch
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class ConsumptionModule {}
