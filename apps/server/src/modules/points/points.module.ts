import { Module } from '@nestjs/common';

/**
 * 健康存折（积分）
 * 文档：§4.13、§11.3.11
 * 拥有的表：prisma/schema/points.prisma：points_ledger, points_rule, points_redeem_item, points_redemption
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#149（PTS-01）。
 */
@Module({})
export class PointsModule {}
