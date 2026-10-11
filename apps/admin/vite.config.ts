import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/**
 * 一个工程三个入口（§3.2、§13.3）：
 *   admin.html     管理端（admin.<域名>）
 *   hospital.html  医院端（hospital.<域名>，独立域名，与管理端共用组件）
 *   mobile.html    顾问移动工作台（企业微信内 H5，admin.<域名>/mobile.html）
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      input: {
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
        hospital: fileURLToPath(new URL('./hospital.html', import.meta.url)),
        mobile: fileURLToPath(new URL('./mobile.html', import.meta.url)),
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
