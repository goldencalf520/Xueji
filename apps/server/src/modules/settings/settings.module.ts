import { Module } from '@nestjs/common';

/**
 * 字典与系统参数
 * 文档：§6.2.19
 * 拥有的表：prisma/schema/settings.prisma：dict_item, system_setting
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class SettingsModule {}
