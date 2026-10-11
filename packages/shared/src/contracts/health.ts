import { z } from 'zod';

/**
 * 示例契约：服务健康检查（GET /api/v1/health）。
 *
 * 契约文件约定（每个业务域一个文件，由该域的后端 issue 独占维护）：
 *  1. 用 zod 定义请求 / 响应结构，导出 schema 和 z.infer 类型；
 *  2. 服务端用 nestjs-zod 的 createZodDto(schema) 生成 DTO（自动校验 + OpenAPI）；
 *  3. 小程序 / 管理端直接 import 类型，不手写接口类型。
 */
export const HealthStatus = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  time: z.string(),
});
export type HealthStatus = z.infer<typeof HealthStatus>;
