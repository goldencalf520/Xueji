import { Module } from '@nestjs/common';

/**
 * 服务前禁忌口头确认记录
 * 文档：§4.8、§6.3
 * 拥有的表：prisma/schema/service-check.prisma：service_check
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class ServiceCheckModule {}
