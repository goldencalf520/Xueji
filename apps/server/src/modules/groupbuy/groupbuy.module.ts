import { Module } from '@nestjs/common';

/**
 * 结伴拼团（预约制）
 * 文档：§4.14、§11.3.11
 * 拥有的表：prisma/schema/groupbuy.prisma：groupbuy_activity, groupbuy_group, groupbuy_member
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#152（GB-01）。
 */
@Module({})
export class GroupbuyModule {}
