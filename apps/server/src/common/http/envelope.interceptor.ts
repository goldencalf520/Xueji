import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type ApiResponse, ErrorCode } from '@xueji/shared';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

const SKIP_ENVELOPE = 'xueji:skip-envelope';

/** 跳过统一信封：用于流式响应（魔镜 chunked）、文件下载、企微 / 微信回调等需要原样输出的接口 */
export const SkipEnvelope = () => SetMetadata(SKIP_ENVELOPE, true);

/** 把控制器返回值包成 { code: 0, message: 'ok', data, requestId }（§12.1） */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ENVELOPE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip || context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request & { id?: string }>();
    return next.handle().pipe(
      map(
        (data): ApiResponse => ({
          code: ErrorCode.OK,
          message: 'ok',
          data: data ?? null,
          requestId: String(req.id ?? ''),
        }),
      ),
    );
  }
}
