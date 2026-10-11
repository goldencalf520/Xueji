import { ErrorCode } from '@xueji/shared';
import { describe, expect, it } from 'vitest';
import { BizException } from '../errors/biz.exception';
import { decodeCursor, encodeCursor, type PaginateOptions, paginate } from './cursor-pagination';

interface Row {
  id: bigint;
  createdAt: Date;
  name: string;
}

/**
 * 实现 paginate 生成的 Prisma 过滤子集（gt / lt、对象隐式 AND、AND / OR 数组、等值），
 * 用于在单元测试里验证续读条件的正确性（不依赖数据库）。
 */
type Filter = Record<string, unknown>;

function fakeDelegate(rows: Row[]) {
  return {
    async findMany(args: { where?: unknown; orderBy?: unknown; take: number }) {
      let out = rows.filter((r) => matches(r, args.where));
      const orderBy = Array.isArray(args.orderBy)
        ? (args.orderBy as Record<string, string>[])
        : [args.orderBy as Record<string, string>];
      // 逆序逐键排序：先应用次要键，最后应用主键（V8 sort 稳定）；方向并入比较器
      for (const entry of orderBy.slice().reverse()) {
        for (const [field, dir] of Object.entries(entry)) {
          const sign = dir === 'desc' ? -1 : 1;
          out = out
            .map((r, i) => ({ r, i }))
            .sort((a, b) => cmp(a.r[field], b.r[field]) * sign || a.i - b.i)
            .map((x) => x.r);
        }
      }
      return out.slice(0, args.take);
    },
  };
}

function matches(record: Row, cond: unknown): boolean {
  if (cond === undefined || cond === null) return true;
  if (typeof cond !== 'object') return false;
  const rec = record as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(cond as Filter)) {
    if (k === 'AND') {
      if (!(v as Filter[]).every((c) => matches(record, c))) return false;
    } else if (k === 'OR') {
      if (!(v as Filter[]).some((c) => matches(record, c))) return false;
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      if ('gt' in (v as object) && !(cmp(rec[k], (v as { gt: unknown }).gt) > 0)) return false;
      if ('lt' in (v as object) && !(cmp(rec[k], (v as { lt: unknown }).lt) < 0)) return false;
    } else if (cmp(rec[k], v) !== 0) {
      return false;
    }
  }
  return true;
}

/** 归一化后比较，口径与 MySQL 排序一致：Date / bigint / ISO 时间串 / 纯数字串 → 数值 */
function cmp(a: unknown, b: unknown): number {
  const na = norm(a);
  const nb = norm(b);
  return na < nb ? -1 : na > nb ? 1 : 0;
}

function norm(v: unknown): number | string {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/.test(v)) return Date.parse(v);
    if (/^\d+$/.test(v)) return Number(v);
  }
  return v as number | string;
}

/** 30 行数据：前 13 行 createdAt 完全相同（验证同排序值并列时的边界） */
function makeRows(): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 30; i++) {
    const ts = i < 13 ? 0 : (i - 12) * 60_000;
    rows.push({
      id: BigInt(1000 + i),
      createdAt: new Date(1_700_000_000_000 + ts),
      name: `row-${i}`,
    });
  }
  return rows;
}

function sortedIds(rows: Row[], direction: 'asc' | 'desc'): string[] {
  return rows
    .slice()
    .sort((a, b) => {
      const byTime =
        (a.createdAt.getTime() - b.createdAt.getTime()) * (direction === 'asc' ? 1 : -1);
      return byTime || Number(a.id - b.id) * (direction === 'asc' ? 1 : -1);
    })
    .map((r) => r.id.toString());
}

async function walkAll(
  rows: Row[],
  direction: 'asc' | 'desc',
  pageSize: number,
): Promise<string[]> {
  const delegate = fakeDelegate(rows);
  const seen: string[] = [];
  let cursor: string | null = null;
  let page: { items: Row[]; nextCursor: string | null };
  let pages = 0;
  do {
    page = await paginate<Row>(delegate, {
      orderBy: { createdAt: direction },
      cursor,
      limit: pageSize,
    } satisfies PaginateOptions);
    seen.push(...page.items.map((r) => r.id.toString()));
    cursor = page.nextCursor;
    if (++pages > 100) throw new Error('翻页死循环');
  } while (cursor !== null);
  return seen;
}

describe('encodeCursor / decodeCursor', () => {
  it('编码是不透明 base64url，解码还原排序键与 id', () => {
    const cursor = encodeCursor(new Date(1_700_000_000_000), 123n);
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    const payload = decodeCursor(cursor);
    expect(payload.s).toBe('2023-11-14T22:13:20.000Z');
    expect(payload.i).toBe('123');
    expect(decodeCursor(encodeCursor(42, '7'))).toEqual({ s: 42, i: '7' });
    expect(decodeCursor(encodeCursor('abc', 9)).i).toBe('9');
  });

  it('垃圾游标 → 40020', () => {
    for (const bad of ['!!!not-base64!!!', 'eyJzIjpudWxsLCJpIjoiMSJ9', 'e30=']) {
      try {
        decodeCursor(bad);
        expect.unreachable(`应当拒绝 ${bad}`);
      } catch (e) {
        expect(e).toBeInstanceOf(BizException);
        expect((e as BizException).code).toBe(ErrorCode.INVALID_PARAMS);
      }
    }
  });
});

describe('paginate', () => {
  it('升序翻页：同时间戳的 13 条记录不重复、不遗漏', async () => {
    const rows = makeRows();
    const seen = await walkAll(rows, 'asc', 5);
    expect(seen).toHaveLength(30);
    expect(new Set(seen).size).toBe(30); // 无重复
    expect(seen).toEqual(sortedIds(rows, 'asc'));
  });

  it('降序翻页：同样不重复、不遗漏，且顺序正确', async () => {
    const rows = makeRows();
    const seen = await walkAll(rows, 'desc', 4);
    expect(seen).toHaveLength(30);
    expect(new Set(seen).size).toBe(30);
    expect(seen).toEqual(sortedIds(rows, 'desc'));
  });

  it('业务 where 条件与游标条件合并：只翻“激活”的记录', async () => {
    const rows = makeRows().map((r, i) => ({ ...r, status: i % 2 === 0 ? 'active' : 'disabled' }));
    const delegate = fakeDelegate(rows);
    const seen: string[] = [];
    let cursor: string | null = null;
    let page: { items: (Row & { status: string })[]; nextCursor: string | null };
    do {
      page = await paginate(delegate, {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        cursor,
        limit: 3,
      });
      seen.push(...page.items.map((r) => r.id.toString()));
      cursor = page.nextCursor;
    } while (cursor !== null);
    expect(seen).toHaveLength(15);
    expect(seen.every((id) => Number(id) % 2 === 0)).toBe(true);
  });

  it('不足一页时 nextCursor 为 null', async () => {
    const delegate = fakeDelegate(makeRows().slice(0, 5));
    const page = await paginate(delegate, { orderBy: { createdAt: 'asc' }, limit: 10 });
    expect(page.items).toHaveLength(5);
    expect(page.nextCursor).toBeNull();
  });

  it('limit 缺省 20（DEFAULT_PAGE_LIMIT）', async () => {
    const page = await paginate(fakeDelegate(makeRows()), { orderBy: { createdAt: 'asc' } });
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).not.toBeNull();
  });

  it('orderBy 多字段 / 非法方向 → 编程错误直接抛出', async () => {
    await expect(
      paginate(fakeDelegate(makeRows()), { orderBy: { createdAt: 'asc', name: 'asc' } as never }),
    ).rejects.toThrow('单字段');
    await expect(
      paginate(fakeDelegate(makeRows()), { orderBy: { createdAt: 'up' } as never }),
    ).rejects.toThrow('asc');
  });

  it('游标落在同时间戳记录中间时，下一页从正确的 id 继续（id 决胜）', async () => {
    const delegate = fakeDelegate(makeRows());
    const page1 = await paginate(delegate, { orderBy: { createdAt: 'asc' }, limit: 5 });
    expect(page1.items.map((r) => Number(r.id))).toEqual([1000, 1001, 1002, 1003, 1004]);
    const page2 = await paginate(delegate, {
      orderBy: { createdAt: 'asc' },
      cursor: page1.nextCursor,
      limit: 5,
    });
    expect(page2.items.map((r) => Number(r.id))).toEqual([1005, 1006, 1007, 1008, 1009]);
  });
});
