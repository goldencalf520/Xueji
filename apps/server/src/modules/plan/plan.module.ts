import { Module } from '@nestjs/common';

/**
 * 方案生成、模板文案、审核、发送
 * 文档：§4.7、§6.2.9、§9.5、§11.3.9
 * 拥有的表：prisma/schema/plan.prisma：h_plan
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class PlanModule {}
