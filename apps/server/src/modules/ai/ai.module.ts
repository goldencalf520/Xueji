import { Module } from '@nestjs/common';

/**
 * AI 网关接入：调用记录、限流、内容安全、预算
 * 文档：§10.2、§10.11
 * 拥有的表：prisma/schema/ai.prisma：ai_call_log
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class AiModule {}
