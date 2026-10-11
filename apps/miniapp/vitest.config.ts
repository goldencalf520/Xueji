import { defineConfig } from 'vitest/config';

// 小程序的纯逻辑（utils、stores、表单渲染规则等）用 vitest 测；页面交互用 miniprogram-automator（§17.7）
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
