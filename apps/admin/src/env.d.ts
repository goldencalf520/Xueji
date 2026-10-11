/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}

interface ImportMetaEnv {
  /** 接口根地址，默认同源 /api/v1 */
  readonly VITE_API_BASE?: string;
}
