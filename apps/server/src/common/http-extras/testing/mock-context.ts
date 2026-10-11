import type { ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../request-context';

/** 单元测试用的最小 ExecutionContext（http 类型） */
export function mockContext(
  handler: unknown,
  classRef: unknown,
  req: Partial<AuthenticatedRequest> & { headers?: Record<string, string> } = {},
  res: Partial<Response> = {},
): ExecutionContext {
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers ?? {})) headers[k.toLowerCase()] = v;
  const request = {
    path: '/api/v1/app/test',
    ip: '127.0.0.1',
    id: `req-${mockContext.requestCounter++}`,
    ...req,
    header: (name: string) => headers[name.toLowerCase()],
  };
  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => classRef,
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => res }),
  } as unknown as ExecutionContext;
}
mockContext.requestCounter = 0;
