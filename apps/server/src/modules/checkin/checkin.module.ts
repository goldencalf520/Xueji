import { Module } from '@nestjs/common';

/**
 * 打卡（睡眠、运动、喝水、经期）
 * 文档：§5.3 P-28、§11.3.11
 * 拥有的表：prisma/schema/checkin.prisma：checkin
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#150（CHKIN-01）。
 */
@Module({})
export class CheckinModule {}
