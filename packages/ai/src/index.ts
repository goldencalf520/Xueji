/**
 * @xueji/ai：AI 网关、提示词与输出校验。
 *
 * 目录约定（各由独立 issue 实现，通过子路径引用）：
 *   @xueji/ai/gateway/*     统一 chat 接口、OpenAI 兼容适配、脱敏、重试、熔断
 *   @xueji/ai/prompts/*     提示词 P1–P6，每个文件导出 { version, system, buildUser }
 *   @xueji/ai/validators/*  输出校验（结构、骨架一致、禁用词、长度、数字日期一致）
 */
export type * from './types';
