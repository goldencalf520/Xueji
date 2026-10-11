import { z } from 'zod';

/**
 * 接口防护的环境变量（common/http-extras 独占）。
 * 变量名登记在仓库根 .env.example；只涉及全局默认限流，装饰器参数在代码里声明。
 */
export const HttpExtrasEnv = z.object({
  /** 全局默认限流开关（按 IP，健康检查除外）；关闭后 @RateLimit 装饰器仍生效 */
  RATE_LIMIT_GLOBAL_ENABLED: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .default(true),
  /** 窗口内每个 IP 允许的请求总数 */
  RATE_LIMIT_GLOBAL_LIMIT: z.coerce.number().int().min(1).max(1_000_000).default(300),
  /** 滑动窗口长度（秒） */
  RATE_LIMIT_GLOBAL_WINDOW_SEC: z.coerce.number().int().min(1).max(3600).default(60),
});

export type HttpExtrasEnv = z.infer<typeof HttpExtrasEnv>;

/** 环境变量字符串 → 布尔：注意不能用 z.coerce.boolean()，它会把字符串 'false' 判成 true */
export function loadHttpExtrasEnv(source: NodeJS.ProcessEnv = process.env): HttpExtrasEnv {
  const parsed = HttpExtrasEnv.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`接口防护（common/http-extras）环境变量校验失败：\n${issues}`);
  }
  return parsed.data;
}
