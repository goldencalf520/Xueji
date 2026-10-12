import type { WechatFetch } from '../wechat.transport';

/**
 * 微信 SDK 单元测试用的 HTTP mock（SRV-10 / #29）。
 *
 * 按预设队列逐次返回响应，并记录每次调用的 URL 与 init，用来断言请求形状（path / query / body）。
 */

export interface RecordedCall {
  url: string;
  init: RequestInit | undefined;
}

type QueuedResponse =
  | { kind: 'json'; body: unknown; status?: number }
  | { kind: 'binary'; buffer: Buffer; contentType: string }
  | { kind: 'text'; text: string; contentType?: string; status?: number }
  | { kind: 'error'; error: unknown };

export class MockFetch {
  readonly calls: RecordedCall[] = [];
  private readonly queue: QueuedResponse[] = [];

  enqueueJson(body: unknown, status = 200): this {
    this.queue.push({ kind: 'json', body, status });
    return this;
  }

  enqueueBinary(buffer: Buffer, contentType = 'image/png'): this {
    this.queue.push({ kind: 'binary', buffer, contentType });
    return this;
  }

  /** 返回非 JSON 内容（模拟网关 / 代理的 HTML 错误页） */
  enqueueText(text: string, contentType = 'text/html', status = 200): this {
    this.queue.push({ kind: 'text', text, contentType, status });
    return this;
  }

  /** 模拟网络层失败（如 ECONNRESET、超时） */
  enqueueError(error: unknown): this {
    this.queue.push({ kind: 'error', error });
    return this;
  }

  get fetch(): WechatFetch {
    return async (input, init) => {
      this.calls.push({ url: input, init });
      const next = this.queue.shift();
      if (!next) throw new Error(`MockFetch: 没有预设响应了（第 ${this.calls.length} 次调用）`);
      switch (next.kind) {
        case 'json':
          return new Response(JSON.stringify(next.body), {
            status: next.status ?? 200,
            headers: { 'content-type': 'application/json' },
          });
        case 'binary':
          return new Response(new Uint8Array(next.buffer), {
            status: 200,
            headers: { 'content-type': next.contentType },
          });
        case 'text':
          return new Response(next.text, {
            status: next.status ?? 200,
            headers: { 'content-type': next.contentType ?? 'text/html' },
          });
        case 'error':
          throw next.error;
      }
    };
  }

  get callCount(): number {
    return this.calls.length;
  }

  /** 最近一次调用的 URL（未调用过则抛错，避免断言静默通过） */
  lastUrl(): string {
    const last = this.calls[this.calls.length - 1];
    if (!last) throw new Error('MockFetch: 还没有任何调用');
    return last.url;
  }

  lastJsonBody(): unknown {
    const last = this.calls[this.calls.length - 1];
    if (!last?.init?.body) throw new Error('MockFetch: 最近一次调用没有请求体');
    return JSON.parse(String(last.init.body)) as unknown;
  }
}
