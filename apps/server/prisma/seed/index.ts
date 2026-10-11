/**
 * 种子入口：按文件名顺序执行 prisma/seed/ 下的 *.seed.ts（每个业务域一个文件，互不修改）。
 * 每个种子文件导出 `export default async function seed(prisma: PrismaClient): Promise<void>`，必须幂等（upsert）。
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { createPrismaClient } from '../../src/common/prisma/prisma.factory';

async function main() {
  const prisma = createPrismaClient();
  const dir = __dirname;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.seed.ts'))
    .sort();
  for (const file of files) {
    const mod = (await import(path.join(dir, file))) as {
      default: (p: typeof prisma) => Promise<void>;
    };
    console.log(`[seed] ${file}`);
    await mod.default(prisma);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
