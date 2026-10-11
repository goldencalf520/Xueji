import uni from '@dcloudio/vite-plugin-uni';
import { defineConfig } from 'vite';

// uni-app 3.x 锁定 vite 5.2.8 / vue 3.4.21，升级须跟随 DCloud 官方版本（见 docs/architecture/adr/0001）
export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler', silenceDeprecations: ['legacy-js-api'] },
    },
  },
});
