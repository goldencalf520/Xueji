import { Module } from '@nestjs/common';

/**
 * 报告生成、审核、PDF
 * 文档：§5.3 P-16、§6.2.10
 * 拥有的表：prisma/schema/report.prisma：h_report
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#126（RPT-01）。
 */
@Module({})
export class ReportModule {}
