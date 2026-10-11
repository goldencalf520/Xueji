import { z } from 'zod';

/**
 * 通用 zod 片段。各域契约（src/contracts/*.ts）组合这些片段，保证三端口径一致。
 */

/** 数据库主键是 BIGINT，接口里统一序列化为字符串 */
export const zId = z.string().regex(/^\d+$/, '无效的 ID');

/** ISO 8601 时间（带时区，如 2026-10-10T09:30:00+08:00） */
export const zDateTime = z.iso.datetime({ offset: true });

/** 日期（YYYY-MM-DD） */
export const zDate = z.iso.date();

/** 中国大陆手机号 */
export const zPhone = z.string().regex(/^1\d{10}$/, '手机号格式不正确');

/** 游标分页请求参数 */
export const zCursorQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorQuery = z.infer<typeof zCursorQuery>;

/** 游标分页响应 */
export const zCursorPage = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
