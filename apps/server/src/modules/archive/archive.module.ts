import { Module } from '@nestjs/common';

/**
 * 健康档案时间轴、总览、趋势
 * 文档：§5.3 P-02/P-15/P-17、§11.3.8
 * 拥有的表：prisma/schema/archive.prisma：h_record
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class ArchiveModule {}
