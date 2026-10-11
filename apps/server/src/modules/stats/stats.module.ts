import { Module } from '@nestjs/common';

/**
 * 埋点接收、指标聚合、数据看板
 * 文档：§15
 * 拥有的表：prisma/schema/stats.prisma：event_log, stats_daily
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#161（STAT-01） → #162（STAT-02）。
 */
@Module({})
export class StatsModule {}
