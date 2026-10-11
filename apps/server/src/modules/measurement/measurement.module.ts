import { Module } from '@nestjs/common';

/**
 * 门店测量数据导入
 * 文档：§6.2.8、§9.9
 * 拥有的表：prisma/schema/measurement.prisma：h_measurement, measurement_import_batch
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class MeasurementModule {}
