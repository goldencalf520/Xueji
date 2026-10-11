import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// NestJS 依赖 emitDecoratorMetadata，esbuild 不支持，改用 SWC 转译测试代码
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    root: './',
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
