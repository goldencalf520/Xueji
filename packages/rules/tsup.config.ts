import { defineConfig } from 'tsup';

// 每个 src 下的 .ts 文件都是一个独立入口，便于以 `@xueji/shared/contracts/<域>` 子路径引用，
// 新增文件无需修改任何集中配置（避免多 agent 并行开发时的冲突）。
export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  splitting: false,
});
