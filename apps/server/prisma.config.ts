import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 配置。schema 采用多文件模式：prisma/schema/ 下每个业务域一个 .prisma 文件，
 * 由对应 issue 独占维护（见 docs/conventions/database.md）。
 */
export default defineConfig({
  schema: path.join('prisma', 'schema'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    // prisma generate 不需要连库；migrate / seed 需要真实的 DATABASE_URL
    url: process.env.DATABASE_URL ?? 'mysql://root:root@localhost:3306/xueji',
    // migrate dev / migrate diff --from-migrations 需要影子库（CI 的 migrations-in-sync 检查使用）
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
