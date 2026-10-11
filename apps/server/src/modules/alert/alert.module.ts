import { Module } from '@nestjs/common';

/**
 * 风险预警与升级
 * 文档：§4.4、§6.2.11、§9.3
 * 拥有的表：prisma/schema/alert.prisma：h_risk_alert
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class AlertModule {}
