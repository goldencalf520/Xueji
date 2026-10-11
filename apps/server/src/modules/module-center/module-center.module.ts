import { Module } from '@nestjs/common';

/**
 * 模块管理与可见性计算
 * 文档：§4.3、§6.2.4、§11.3.5
 * 拥有的表：prisma/schema/module.prisma：module
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class ModuleCenterModule {}
