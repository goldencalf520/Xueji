import { Module } from '@nestjs/common';

/**
 * 接送预约与调度
 * 文档：§5.3 P-26
 * 拥有的表：prisma/schema/transport.prisma：transport_request
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class TransportModule {}
