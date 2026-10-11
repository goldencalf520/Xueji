import { Module } from '@nestjs/common';

/**
 * 审计日志（只追加）与查询
 * 文档：§11.3.14、§13.5
 * 拥有的表：prisma/schema/audit.prisma：audit_log
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#25（SRV-06）。
 */
@Module({})
export class AuditModule {}
