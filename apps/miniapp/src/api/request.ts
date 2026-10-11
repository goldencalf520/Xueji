import { type ApiResponse, ErrorCode, ErrorMessage } from '@xueji/shared';

/**
 * 小程序请求封装骨架：拆统一响应信封（§12.1）。
 * 令牌注入、40001 刷新、40010 跳授权页、40011 跳手机号验证、离线缓存由 MP-01 issue 补全。
 */
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly data: unknown,
    readonly requestId: string,
  ) {
    super(message);
  }
}

/**
 * 注意：wx.request 不支持 PATCH。用户端（/app）接口的部分更新一律用 PUT（见 docs/conventions/api.md），
 * 文档 §12.2 中的 PATCH /me、PATCH /me/settings、PATCH /family/links/{id} 均按 PUT 实现。
 */
export type AppHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export function request<T>(options: {
  url: string;
  method?: AppHttpMethod;
  data?: Record<string, unknown>;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE}/app${options.url}`,
      method: options.method ?? 'GET',
      data: options.data,
      success: (res) => {
        const body = res.data as ApiResponse<T>;
        if (body && body.code === ErrorCode.OK) resolve(body.data);
        else
          reject(
            new ApiError(
              body?.code ?? ErrorCode.INTERNAL,
              body?.message ?? ErrorMessage[ErrorCode.INTERNAL],
              body?.data ?? null,
              body?.requestId ?? '',
            ),
          );
      },
      fail: () =>
        reject(new ApiError(ErrorCode.INTERNAL, ErrorMessage[ErrorCode.INTERNAL], null, '')),
    });
  });
}
