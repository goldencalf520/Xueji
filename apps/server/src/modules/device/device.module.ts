import { Module } from '@nestjs/common';

/**
 * 门店设备准入、指标白名单、报告模板
 * 文档：§4.10、§6.2.8
 * 拥有的表：prisma/schema/device.prisma：device, device_metric
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#125（DEV-01）。
 */
@Module({})
export class DeviceModule {}
