import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// 端到端 / 接口测试：需要 MySQL 与 Redis（pnpm db:up），见 docs/conventions/backend.md
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e.ts'],
    root: './',
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
