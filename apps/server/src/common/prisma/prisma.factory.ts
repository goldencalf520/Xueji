import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * 创建 Prisma 客户端（Prisma 7 需要显式的驱动适配器；MySQL 使用 mariadb 驱动）。
 * 字段自动加解密（*_enc）等 $extends 扩展由 SRV-02 issue 在 PrismaService 中挂载。
 */
export function createPrismaClient(databaseUrl = process.env.DATABASE_URL): PrismaClient {
  if (!databaseUrl) throw new Error('DATABASE_URL 未配置');
  // mariadb 驱动只识别 mariadb:// 协议，与 MySQL 8 完全兼容
  const url = databaseUrl.replace(/^mysql:\/\//, 'mariadb://');
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter });
}
