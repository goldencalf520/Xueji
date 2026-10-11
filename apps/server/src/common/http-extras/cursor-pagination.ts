import { type CursorPage, DEFAULT_PAGE_LIMIT, ErrorCode, MAX_PAGE_LIMIT } from '@xueji/shared';
import { BizException } from '../errors/biz.exception';

/** 游标负载：排序键的末值 + 该记录的 id（BIGINT 序列化为字符串） */
interface CursorPayload {
  s: number | string;
  i: string;
}

/** 游标编码：不透明 base64url(JSON)，解码失败 / 结构不符 → 40020 */
export function encodeCursor(
  sortValue: number | string | Date,
  id: bigint | number | string,
): string {
  const s = sortValue instanceof Date ? sortValue.toISOString() : sortValue;
  const i = typeof id === 'bigint' ? id.toString() : String(id);
  return Buffer.from(JSON.stringify({ s, i }), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload;
    const s = parsed?.s;
    const i = parsed?.i;
    if (
      (typeof s !== 'number' && typeof s !== 'string') ||
      typeof i !== 'string' ||
      !/^\d+$/.test(i)
    ) {
      throw new Error('bad cursor');
    }
    return { s, i };
  } catch {
    throw new BizException(ErrorCode.INVALID_PARAMS, '分页参数有误，请重新打开列表');
  }
}

/** 只要求 delegate 具备 findMany（方法语法是双变的，任何 Prisma 模型 delegate 都满足） */
interface FindManyDelegate<T> {
  findMany(args: { where?: unknown; orderBy?: unknown; take: number }): Promise<T[]>;
}

export interface PaginateOptions {
  /** 业务过滤条件（与游标续读条件做 AND 合并） */
  where?: Record<string, unknown>;
  /** 排序：目前支持单字段（'asc' | 'desc'），id 始终作为并列时的次序（方向与主序一致） */
  orderBy: Record<string, 'asc' | 'desc'>;
  /** 上页返回的 nextCursor；首页不传 */
  cursor?: string | null;
  /** 每页条数，缺省 DEFAULT_PAGE_LIMIT，钳制在 1–MAX_PAGE_LIMIT */
  limit?: number;
}

/**
 * 游标分页（§12.1）：keyset 方式，排序值相同时按 id 决胜，翻页不重复、不遗漏。
 *
 * @example
 *   const page = await paginate(prisma.client.customer, {
 *     where: { status: 'active' },
 *     orderBy: { createdAt: 'desc' },
 *     cursor: query.cursor,
 *     limit: query.limit,
 *   });
 *   // → { items, nextCursor }，nextCursor 为 null 表示没有更多
 */
export async function paginate<T extends { id: bigint | number | string }>(
  delegate: FindManyDelegate<T>,
  options: PaginateOptions,
): Promise<CursorPage<T>> {
  const fields = Object.keys(options.orderBy);
  if (fields.length !== 1) {
    throw new Error('paginate 目前只支持单字段排序（orderBy 恰好一个字段），id 作为并列时的次序');
  }
  const field = fields[0];
  if (field === undefined) throw new Error('paginate 的 orderBy 不能为空');
  const direction = options.orderBy[field];
  if (direction !== 'asc' && direction !== 'desc') {
    throw new Error(`paginate 的排序方向必须是 'asc' 或 'desc'，收到 ${String(direction)}`);
  }

  const limit = Math.min(Math.max(options.limit ?? DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);

  // 续读条件：(field > 末值) OR (field = 末值 AND id > 末 id)，方向随 asc / desc 反转
  const conditions: Record<string, unknown>[] = [];
  if (options.where && Object.keys(options.where).length > 0) conditions.push(options.where);
  if (options.cursor) {
    const last = decodeCursor(options.cursor);
    const op = direction === 'asc' ? 'gt' : 'lt';
    conditions.push({
      OR: [{ [field]: { [op]: last.s } }, { [field]: last.s, id: { [op]: last.i } }],
    });
  }

  const rows = await delegate.findMany({
    where:
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : { AND: conditions },
    // Prisma 对 DateTime 字段接受 ISO 字符串比较；id 接受字符串（BIGINT）
    orderBy: [{ [field]: direction }, { id: direction }],
    take: limit + 1, // 多取 1 条用于判断是否还有下一页
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = items[items.length - 1];
  let nextCursor: string | null = null;
  if (hasMore && lastItem !== undefined) {
    const value = (lastItem as Record<string, unknown>)[field];
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      nextCursor = encodeCursor(value, lastItem.id);
    } else {
      throw new Error(`排序字段 ${field} 的值必须是 string / number / Date`);
    }
  }
  return { items, nextCursor };
}
