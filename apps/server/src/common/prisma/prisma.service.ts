import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { createPrismaClient } from './prisma.factory';

/**
 * 全局 Prisma 客户端。业务代码通过 `prisma.client.<model>` 访问；
 * 数据范围（§13.5）与审计由 common/rbac、common/audit 在仓储层注入，不要绕过。
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  /** 懒创建：没有数据库的场景（单元测试、健康检查）不会因缺少 DATABASE_URL 而启动失败 */
  private instance?: PrismaClient;

  get client(): PrismaClient {
    this.instance ??= createPrismaClient();
    return this.instance;
  }

  async onModuleDestroy() {
    await this.instance?.$disconnect();
  }
}
