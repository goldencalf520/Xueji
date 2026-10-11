import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type ApiResponse, ErrorCode, ErrorMessage } from '@xueji/shared';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { BizException, HTTP_STATUS_OF } from './biz.exception';

/** 把所有异常转成统一响应信封（§12.1）。5xx 打错误日志并带 requestId 便于排查 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();
    const requestId = String(req.id ?? '');

    const { code, message, data } = this.toBody(exception);
    const status = HTTP_STATUS_OF[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500) {
      this.logger.error({ err: exception, requestId }, 'unhandled exception');
    }

    const body: ApiResponse = { code, message, data, requestId };
    res.status(status).json(body);
  }

  private toBody(exception: unknown): { code: ErrorCode; message: string; data: unknown } {
    if (exception instanceof BizException) {
      return { code: exception.code, message: exception.message, data: exception.data };
    }
    if (exception instanceof ZodValidationException) {
      const fieldErrors: Record<string, string[]> = {};
      const zodError = exception.getZodError() as {
        issues: Array<{ path: PropertyKey[]; message: string }>;
      };
      for (const issue of zodError.issues) {
        const key = issue.path.map(String).join('.') || '_';
        const list = fieldErrors[key] ?? [];
        list.push(issue.message);
        fieldErrors[key] = list;
      }
      return {
        code: ErrorCode.INVALID_PARAMS,
        message: ErrorMessage[ErrorCode.INVALID_PARAMS],
        data: { fieldErrors },
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code =
        status === 401
          ? ErrorCode.UNAUTHORIZED
          : status === 403
            ? ErrorCode.FORBIDDEN
            : status === 404
              ? ErrorCode.NOT_FOUND
              : status === 409
                ? ErrorCode.CONFLICT
                : status === 429
                  ? ErrorCode.TOO_MANY_REQUESTS
                  : status < 500
                    ? ErrorCode.INVALID_PARAMS
                    : ErrorCode.INTERNAL;
      return { code, message: ErrorMessage[code], data: null };
    }
    return {
      code: ErrorCode.INTERNAL,
      message: ErrorMessage[ErrorCode.INTERNAL],
      data: null,
    };
  }
}
