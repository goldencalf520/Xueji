import { Module } from '@nestjs/common';

/**
 * 规则引擎运行时（调用 @xueji/rules）与方案引擎配置数据
 * 文档：§4.7、§4.8、§11.3.7、§13.5
 * 拥有的表：prisma/schema/engine.prisma：project, plan_package, h_rule, lifestyle_tip, script
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class EngineModule {}
