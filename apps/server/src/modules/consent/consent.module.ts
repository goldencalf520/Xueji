import { Module } from '@nestjs/common';

/**
 * 授权中心：授权文本、授权记录、撤回
 * 文档：§4.11、§9.10、§11.3.3
 * 拥有的表：prisma/schema/consent.prisma：consent_text, consent_record
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class ConsentModule {}
