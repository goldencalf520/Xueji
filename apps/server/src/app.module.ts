import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { FEATURE_MODULES } from './modules';

/** 根模块：横切基础设施（CommonModule）+ 全部功能模块（modules/index.ts） */
@Module({
  imports: [CommonModule, ...FEATURE_MODULES],
})
export class AppModule {}
