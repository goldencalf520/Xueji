import { Module } from '@nestjs/common';

/**
 * 会员分级：规则、模拟、发布、升降级、保级
 * 文档：§4.1、§9.7、§11.3.4
 * 拥有的表：prisma/schema/tier.prisma：tier_rule, tier_history
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#62（TIER-02）。
 */
@Module({})
export class TierModule {}
