import { Module } from '@nestjs/common';

/**
 * 数据请求（导出 / 注销）与后台导出审批
 * 文档：§5.3 P-39、§11.3.14、§14.2
 * 拥有的表：prisma/schema/privacy.prisma：data_request, export_request
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#49（PRV-01）。
 */
@Module({})
export class PrivacyModule {}
