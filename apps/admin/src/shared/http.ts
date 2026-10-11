import { type ApiResponse, ErrorCode, ErrorMessage } from '@xueji/shared';
import axios, { type AxiosInstance } from 'axios';

/**
 * 三个入口共用的 HTTP 客户端工厂：拆统一响应信封（§12.1），code ≠ 0 时抛 ApiError。
 * 令牌存取、40001 刷新与跳转登录由 ADM-01（管理端框架）issue 通过 hooks 注入。
 */
export class ApiError<T = unknown> extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly data: T,
    readonly requestId: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface HttpHooks {
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export function createHttp(prefix: '/admin' | '/hospital', hooks: HttpHooks = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE ?? '/api/v1'}${prefix}`,
    timeout: 15_000,
  });

  instance.interceptors.request.use((config) => {
    const token = hooks.getToken?.();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  instance.interceptors.response.use(
    (res) => {
      const body = res.data as ApiResponse;
      if (body && typeof body === 'object' && 'code' in body && body.code !== ErrorCode.OK) {
        throw new ApiError(body.code, body.message, body.data, body.requestId);
      }
      // 解包：调用方直接拿到 data
      res.data = (body as ApiResponse).data;
      return res;
    },
    (err) => {
      const body = err?.response?.data as ApiResponse | undefined;
      if (body?.code === ErrorCode.UNAUTHORIZED) hooks.onUnauthorized?.();
      if (body && typeof body.code === 'number') {
        throw new ApiError(body.code, body.message, body.data, body.requestId);
      }
      throw new ApiError(ErrorCode.INTERNAL, ErrorMessage[ErrorCode.INTERNAL], null, '');
    },
  );
  return instance;
}
