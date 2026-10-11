import { z } from 'zod';

/**
 * 核心环境变量（所有进程都需要）。
 * 业务模块自己的配置（微信、企微、COS、AI……）在各模块目录内用 zod 定义并在模块加载时校验，
 * 不要往这里加 —— 这是多 agent 并行开发的冲突热点。变量名统一登记在仓库根目录 .env.example。
 */
export const AppEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  /** api：对外 HTTP 服务；worker：BullMQ 任务进程（§13.2） */
  APP_ROLE: z.enum(['api', 'worker']).default('api'),
  PORT: z.coerce.number().int().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  /** 对外访问的 API 根地址，用于生成回调、下载链接 */
  PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3000'),
  /** 是否开放 /api/docs（OpenAPI）。生产环境必须关闭 */
  OPENAPI_ENABLED: z.coerce.boolean().default(true),
});
export type AppEnv = z.infer<typeof AppEnv>;

export function loadAppEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = AppEnv.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`环境变量校验失败：\n${issues}`);
  }
  return parsed.data;
}
