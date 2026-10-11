/**
 * @xueji/shared 根入口：只导出跨域通用的基础内容（枚举词汇、错误码、响应信封、通用 zod 片段）。
 *
 * 各业务域的接口契约放在 `src/contracts/<域>.ts`，通过子路径引用：
 *   import { LoginRequest } from '@xueji/shared/contracts/auth-app';
 * 不要在这里 re-export 业务契约 —— 这个文件是多 agent 并行开发的冲突热点，保持稳定。
 */
export * from './core/enums';
export * from './core/response';
export * from './core/zod';
