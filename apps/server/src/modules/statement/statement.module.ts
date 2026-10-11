import { Module } from '@nestjs/common';

/**
 * 医院对账
 * 文档：§7.7
 * 拥有的表：prisma/schema/statement.prisma：hospital_statement, hospital_statement_item
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#136（HOSP-03）。
 */
@Module({})
export class StatementModule {}
