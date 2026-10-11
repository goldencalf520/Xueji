import { Module } from '@nestjs/common';

/**
 * 家人绑定与授权查看
 * 文档：§5.3 P-32～P-35、§11.3.2
 * 拥有的表：prisma/schema/family.prisma：family_link
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#79（FAM-01） → #93（FAM-02）。
 */
@Module({})
export class FamilyModule {}
