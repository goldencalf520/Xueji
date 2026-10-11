import {
  WECHAT_HTTP_MAX_ATTEMPTS,
  WECHAT_HTTP_RETRY_DELAY_MS,
  WECHAT_HTTP_TIMEOUT_MS,
} from './wechat.config';
import { toWechatApiError, WECHAT_UNEXPECTED_RESPONSE_CODE, WechatApiError } from './wechat.errors';

/**
 * 微信 HTTP 传输层（SRV-10 / #29）：拼 URL、超时、错误归一、退避重试。
 *
 * 这一层只关心「把请求发出去、把 errcode 变成异常」，业务语义放在 WechatRealClient。
 * `fetchImpl` 可注入，便于单元测试用 HTTP mock 覆盖每个接口。
 */

export type WechatFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type WechatQueryValue = string | number | boolean | undefined;

export interface WechatTransportOptions {
  apiBaseUrl: string;
  /** 缺省用全局 fetch */
  fetchImpl?: WechatFetch;
  timeoutMs?: number;
  /** 可重试错误的最大尝试次数（含首次），缺省 3 */
  maxAttempts?: number;
  /** 重试前的等待，缺省按次数线性退避；测试可注入立即返回的实现 */
  sleep?: (ms: number) => Promise<void>;
}

export interface WechatCallOptions {
  /** 是否允许对可重试错误退避重试，缺省允许。**非幂等写操作（如发订阅消息）必须传 false** */
  retry?: boolean;
}

interface WechatRequest {
  method: 'GET' | 'POST';
  query?: Record<string, WechatQueryValue>;
  body?: unknown;
}

export interface BinaryResponse {
  buffer: Buffer;
  contentType: string;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class WechatTransport {
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: WechatFetch;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: WechatTransportOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? WECHAT_HTTP_TIMEOUT_MS;
    this.maxAttempts = options.maxAttempts ?? WECHAT_HTTP_MAX_ATTEMPTS;
    this.sleep = options.sleep ?? defaultSleep;
  }

  /** GET，返回 JSON；微信返回 errcode != 0 时抛 WechatApiError */
  async getJson<T>(
    path: string,
    query?: Record<string, WechatQueryValue>,
    options?: WechatCallOptions,
  ): Promise<T> {
    return this.run(
      async () => readJson<T>(await this.sendOnce(path, { method: 'GET', query })),
      options,
    );
  }

  /** POST JSON，返回 JSON。默认**不重试**（写操作非幂等），需要时显式传 `{ retry: true }` */
  async postJson<T>(
    path: string,
    body: unknown,
    query?: Record<string, WechatQueryValue>,
    options?: WechatCallOptions,
  ): Promise<T> {
    return this.run(
      async () => readJson<T>(await this.sendOnce(path, { method: 'POST', query, body })),
      options,
    );
  }

  /**
   * POST，返回二进制（小程序码）。微信出错时会返回 JSON（HTTP 200 + content-type: application/json），
   * 此时按错误处理；成功则是 image/png。
   */
  async postBinary(
    path: string,
    body: unknown,
    query?: Record<string, WechatQueryValue>,
    options?: WechatCallOptions,
  ): Promise<BinaryResponse> {
    return this.run(async () => {
      const res = await this.sendOnce(path, { method: 'POST', query, body });
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        // 出错：让 readJson 统一把 errcode 变成异常
        await readJson<unknown>(res);
        throw new WechatApiError(WECHAT_UNEXPECTED_RESPONSE_CODE, '微信未返回小程序码图片', {
          httpStatus: res.status,
          retryable: true,
        });
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType: contentType || 'image/png' };
    }, options);
  }

  /** 重试外壳：只对 `retryable` 的错误退避重试 */
  private async run<T>(operation: () => Promise<T>, options?: WechatCallOptions): Promise<T> {
    const attempts = options?.retry === false ? 1 : this.maxAttempts;
    for (let attempt = 1; ; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const apiError = toWechatApiError(error);
        if (attempt >= attempts || !apiError.retryable) throw apiError;
        await this.sleep(WECHAT_HTTP_RETRY_DELAY_MS * attempt);
      }
    }
  }

  private async sendOnce(path: string, request: WechatRequest): Promise<Response> {
    const url = this.buildUrl(path, request.query);
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: request.method,
        ...(request.body === undefined
          ? {}
          : {
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(request.body),
            }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw toWechatApiError(error);
    }
    if (!response.ok) {
      throw new WechatApiError(
        WECHAT_UNEXPECTED_RESPONSE_CODE,
        `微信接口返回 HTTP ${String(response.status)}`,
        {
          httpStatus: response.status,
          retryable: response.status >= 500 || response.status === 429,
        },
      );
    }
    return response;
  }

  private buildUrl(path: string, query?: Record<string, WechatQueryValue>): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.apiBaseUrl}${normalized}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 解析 JSON 响应：非 JSON → 异常；`errcode` 存在且非 0 → 抛 WechatApiError */
async function readJson<T>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WechatApiError(WECHAT_UNEXPECTED_RESPONSE_CODE, '微信返回了无法识别的内容', {
      httpStatus: response.status,
    });
  }
  if (isRecord(payload) && 'errcode' in payload) {
    const errcode = Number(payload.errcode);
    if (Number.isFinite(errcode) && errcode !== 0) {
      const errmsg = typeof payload.errmsg === 'string' ? payload.errmsg : undefined;
      throw new WechatApiError(errcode, errmsg, { httpStatus: response.status });
    }
  }
  return payload as T;
}
