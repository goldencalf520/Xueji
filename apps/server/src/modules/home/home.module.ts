import { Module } from '@nestjs/common';

/**
 * 首页布局配置与 /app/home 解析
 * 文档：§5.6、§6.2.5、§13.5
 * 拥有的表：prisma/schema/home.prisma：home_layout
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#69（HOME-01） → #163（HOME-03）。
 */
@Module({})
export class HomeModule {}
