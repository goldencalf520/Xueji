import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
// 注意：CryptoService 是构造器注入的 DI token，必须值导入（import type 会被擦除导致元数据丢失）
import { CryptoService } from '../crypto/crypto.service';
import { buildEncryptionExtension } from './encryption.extension';
import { createPrismaClient } from './prisma.factory';

/**
 * 全局 Prisma 客户端。业务代码通过 `prisma.client.<model>` 访问；
 * 数据范围（§13.5）与审计由 common/rbac、common/audit 在仓储层注入，不要绕过。
 * 注册过加密字段（registerEncryptedFields）的模型在读写时自动加解密；
 * queryRaw / executeRaw 拿到的是密文，仅限迁移与轮换工具使用。
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  /** 懒创建：没有数据库的场景（单元测试、健康检查）不会因缺少 DATABASE_URL 而启动失败 */
  private instance?: PrismaClient;
  private encrypted?: PrismaClient;

  constructor(private readonly crypto: CryptoService) {}

  get client(): PrismaClient {
    this.instance ??= createPrismaClient();
    this.encrypted ??= this.instance.$extends(
      buildEncryptionExtension(() => this.crypto),
    ) as unknown as PrismaClient;
    return this.encrypted;
  }

  async onModuleDestroy() {
    await this.encrypted?.$disconnect();
    this.instance = undefined;
    this.encrypted = undefined;
  }
}
