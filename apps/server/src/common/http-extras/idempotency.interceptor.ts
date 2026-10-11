import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode, IDEMPOTENCY_HEADER } from '@xueji/shared';
import type { Response } from 'express';
import { type Observable, of, tap } from 'rxjs';
import { BizException } from '../errors/biz.exception';
import { SkipEnvelope } from '../http/envelope.interceptor';
import { RedisService } from '../redis/redis.module';
import { IDEMPOTENT_KEY } from './idempotent.decorator';
import { type AuthenticatedRequest, audienceOf, principalOf } from './request-context';

/** 幂等记录保留时长：24 小时（§12.1） */
export const IDEMPOTENCY_TTL_SEC = 24 * 60 * 60;
/** “处理中”占位键的保留时长：进程崩溃后，幂等键最多阻塞该时长后可重试 */
const PROCESSING_TTL_SEC = 60;

/** 幂等键格式：1–128 个可打印 ASCII 字符 */
const KEY_PATTERN = /^[\x21-\x7e]{1,128}$/;

/** Redis 中存储的幂等记录 */
interface IdempotencyRecord {
  status: 'processing' | 'done';
  /** status=done 时：首次的业务原始值（handler 返回值，信封包装前的值） */
  body?: unknown;
}

/** BigInt 序列化口径与全局一致（BIGINT → string，见 bootstrap.ts） */
function serialize(record: IdempotencyRecord): string {
  return JSON.stringify(record, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
}

function deserialize(raw: string): IdempotencyRecord | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.status === 'processing') return { status: 'processing' };
    if (parsed.status === 'done') return { status: 'done', body: parsed.body };
    return null;
  } catch {
    return null;
  }
}

/**
 * Idempotency-Key 幂等拦截器（§12.1、§14.2）。
 *
 * 本拦截器注册在 EnvelopeInterceptor 内层（CommonModule 自身的全局拦截器先于
 * 其 import 的模块注册），因此缓存与回放的都是“业务原始值”，由 EnvelopeInterceptor
 * 统一包装——回放不会双重包装，业务数据与首次完全一致；requestId 是当次请求的
 * （用于追踪本次日志，与 Stripe 幂等回放语义一致）。回放响应带
 * X-Idempotent-Replay: true 便于排查，HTTP 状态码与首次相同（同一路由状态码固定）。
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') return next.handle();
    const marked = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!marked) return next.handle();
    // 流式 / 原样输出的接口不做幂等缓存
    const skip = this.reflector.getAllAndOverride<boolean>(SkipEnvelope, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    const idempotencyKey = req.header(IDEMPOTENCY_HEADER);
    if (idempotencyKey === undefined) return next.handle(); // 未携带请求头：按普通请求处理
    if (!KEY_PATTERN.test(idempotencyKey)) {
      throw new BizException(ErrorCode.INVALID_PARAMS, '幂等键格式有误');
    }

    const redisKey = `xueji:idem:${audienceOf(req)}:${principalOf(req)}:${idempotencyKey}`;
    const redis = this.redisService.client;

    // 抢占“处理中”占位键；抢不到说明有同键请求在处理或已完成
    if (!(await this.claim(redisKey))) {
      const replay = await this.replay(redisKey, res);
      if (replay) return replay;
      // 占位键可能恰好过期：再抢一次；仍失败视为并发冲突
      if (!(await this.claim(redisKey))) {
        const retry = await this.replay(redisKey, res);
        if (retry) return retry;
        throw new BizException(ErrorCode.CONFLICT, '请求正在处理，请稍候');
      }
    }

    return next.handle().pipe(
      tap({
        next: (value) => {
          // 只缓存成功响应（失败允许同键重试），保留 24 小时
          void redis
            .set(redisKey, serialize({ status: 'done', body: value }), 'EX', IDEMPOTENCY_TTL_SEC)
            .catch(() => undefined);
        },
        error: () => {
          // 失败释放幂等键：业务异常（如参数错误）不应把键占用 24 小时
          void redis.del(redisKey).catch(() => undefined);
        },
      }),
    );
  }

  /** SET NX 占位键，成功返回 true */
  private claim(redisKey: string): Promise<boolean> {
    return this.redisService.client
      .set(redisKey, serialize({ status: 'processing' }), 'EX', PROCESSING_TTL_SEC, 'NX')
      .then((r) => r === 'OK');
  }

  /** 已完成的幂等记录 → 回放首次响应体；处理中 / 记录缺失 → null（由调用方决定后续动作） */
  private async replay(redisKey: string, res: Response): Promise<Observable<unknown> | null> {
    const raw = await this.redisService.client.get(redisKey);
    if (raw === null) return null;
    const record = deserialize(raw);
    if (record === null || record.status === 'processing') return null;
    res.setHeader('X-Idempotent-Replay', 'true');
    return of(record.body ?? null);
  }
}
