import { Module } from '@nestjs/common';

/**
 * 活动：讲座、健康日、报名、签到
 * 文档：§6.2.17、§11.3.11
 * 拥有的表：prisma/schema/activity.prisma：activity, activity_signup
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#94（ACT-01）。
 */
@Module({})
export class ActivityModule {}
