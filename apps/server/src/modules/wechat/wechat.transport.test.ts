import { describe, expect, it } from 'vitest';
import { MockFetch } from './testing/mock-fetch';
import { WechatApiError } from './wechat.errors';
import { WechatTransport } from './wechat.transport';

/** 不等待的重试退避：让重试逻辑在测试里是确定且零耗时的 */
const noSleep = async () => {};

function createTransport(mock: MockFetch, overrides: Partial<{ maxAttempts: number }> = {}) {
  return new WechatTransport({
    apiBaseUrl: 'https://api.weixin.qq.com',
    fetchImpl: mock.fetch,
    sleep: noSleep,
    maxAttempts: overrides.maxAttempts ?? 3,
  });
}

describe('wechat.transport', () => {
  describe('URL 与请求形状', () => {
    it('拼接 baseUrl + path 与 query，跳过 undefined', async () => {
      const mock = new MockFetch().enqueueJson({ ok: true });
      const transport = createTransport(mock);

      await transport.getJson('/cgi-bin/token', {
        grant_type: 'client_credential',
        appid: 'wx1',
        secret: 's1',
        ignored: undefined,
      });

      const url = new URL(mock.lastUrl());
      expect(url.origin + url.pathname).toBe('https://api.weixin.qq.com/cgi-bin/token');
      expect(url.searchParams.get('grant_type')).toBe('client_credential');
      expect(url.searchParams.get('appid')).toBe('wx1');
      expect(url.searchParams.get('secret')).toBe('s1');
      expect(url.searchParams.has('ignored')).toBe(false);
    });

    it('baseUrl 结尾多余的斜杠不会产生双斜杠，path 可不带前导斜杠', async () => {
      const mock = new MockFetch().enqueueJson({ ok: true });
      const transport = new WechatTransport({
        apiBaseUrl: 'https://api.weixin.qq.com/',
        fetchImpl: mock.fetch,
      });

      await transport.getJson('cgi-bin/token');

      expect(mock.lastUrl()).toBe('https://api.weixin.qq.com/cgi-bin/token');
    });

    it('postJson 发送 JSON 请求体并带 content-type', async () => {
      const mock = new MockFetch().enqueueJson({ errcode: 0, errmsg: 'ok' });
      const transport = createTransport(mock);

      await transport.postJson(
        '/wxa/business/getuserphonenumber',
        { code: 'c1' },
        { access_token: 'tk' },
      );

      expect(mock.lastJsonBody()).toEqual({ code: 'c1' });
      expect(mock.calls[0]?.init?.method).toBe('POST');
      const headers = mock.calls[0]?.init?.headers as Record<string, string> | undefined;
      expect(headers?.['content-type']).toBe('application/json');
      expect(new URL(mock.lastUrl()).searchParams.get('access_token')).toBe('tk');
    });
  });

  describe('响应解析', () => {
    it('成功时返回解析后的 JSON', async () => {
      const mock = new MockFetch().enqueueJson({ access_token: 'tk', expires_in: 7200 });
      const transport = createTransport(mock);

      const result = await transport.getJson<{ access_token: string; expires_in: number }>(
        '/cgi-bin/token',
      );

      expect(result).toEqual({ access_token: 'tk', expires_in: 7200 });
    });

    it('errcode 非 0 时抛出 WechatApiError，带上 errcode / errmsg / httpStatus', async () => {
      const mock = new MockFetch().enqueueJson({ errcode: 40013, errmsg: 'invalid appid' });
      const transport = createTransport(mock);

      const error = await transport.getJson('/cgi-bin/token').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(WechatApiError);
      expect((error as WechatApiError).errcode).toBe(40013);
      expect((error as WechatApiError).errmsg).toBe('invalid appid');
      expect((error as WechatApiError).httpStatus).toBe(200);
    });

    it('显式 errcode: 0 视为成功', async () => {
      const mock = new MockFetch().enqueueJson({ errcode: 0, errmsg: 'ok' });
      const transport = createTransport(mock);

      await expect(transport.getJson('/cgi-bin/message/subscribe/send')).resolves.toEqual({
        errcode: 0,
        errmsg: 'ok',
      });
    });

    it('非 JSON 响应归一为不可重试的协议错误', async () => {
      const mock = new MockFetch().enqueueText('<html>502 Bad Gateway</html>');
      const transport = createTransport(mock);

      const error = await transport.getJson('/cgi-bin/token').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(WechatApiError);
      expect((error as WechatApiError).errcode).toBe(-3);
      expect((error as WechatApiError).retryable).toBe(false);
      expect(mock.callCount).toBe(1);
    });

    it('HTTP 5xx 归一为可重试错误，并按 maxAttempts 重试', async () => {
      const mock = new MockFetch()
        .enqueueText('boom', 'text/plain', 500)
        .enqueueText('boom', 'text/plain', 500)
        .enqueueText('boom', 'text/plain', 500);
      const transport = createTransport(mock);

      const error = await transport.getJson('/cgi-bin/token').catch((e: unknown) => e);

      expect((error as WechatApiError).httpStatus).toBe(500);
      expect((error as WechatApiError).message).toBe('微信接口返回 HTTP 500');
      expect(mock.callCount).toBe(3);
    });
  });

  describe('重试策略', () => {
    it('网络异常可重试，第二次成功', async () => {
      const mock = new MockFetch()
        .enqueueError(new Error('ECONNRESET'))
        .enqueueJson({ access_token: 'tk', expires_in: 7200 });
      const transport = createTransport(mock);

      const result = await transport.getJson<{ access_token: string }>('/cgi-bin/token');

      expect(result.access_token).toBe('tk');
      expect(mock.callCount).toBe(2);
    });

    it('-1（系统繁忙）可重试', async () => {
      const mock = new MockFetch()
        .enqueueJson({ errcode: -1, errmsg: 'system error' })
        .enqueueJson({
          access_token: 'tk',
          expires_in: 7200,
        });
      const transport = createTransport(mock);

      await expect(transport.getJson('/cgi-bin/token')).resolves.toMatchObject({
        access_token: 'tk',
      });
      expect(mock.callCount).toBe(2);
    });

    it('令牌失效（40001）在本层不重试，交由 WechatRealClient 刷新令牌后重试', async () => {
      const mock = new MockFetch().enqueueJson({ errcode: 40001, errmsg: 'invalid credential' });
      const transport = createTransport(mock);

      const error = await transport
        .getJson('/wxa/business/getuserphonenumber')
        .catch((e: unknown) => e);

      expect((error as WechatApiError).tokenInvalid).toBe(true);
      expect(mock.callCount).toBe(1);
    });

    it('retry: false 时只请求一次（非幂等写操作）', async () => {
      const mock = new MockFetch()
        .enqueueError(new Error('socket hang up'))
        .enqueueJson({ errcode: 0, errmsg: 'ok' });
      const transport = createTransport(mock);

      await expect(
        transport.postJson('/cgi-bin/message/subscribe/send', {}, undefined, { retry: false }),
      ).rejects.toBeInstanceOf(WechatApiError);
      expect(mock.callCount).toBe(1);
    });

    it('反复失败时最终抛出最后一次错误，不会无限重试', async () => {
      const mock = new MockFetch()
        .enqueueError(new Error('ECONNRESET'))
        .enqueueError(new Error('ECONNRESET'))
        .enqueueError(new Error('ECONNRESET'))
        .enqueueJson({ access_token: 'unused' });
      const transport = createTransport(mock);

      await expect(transport.getJson('/cgi-bin/token')).rejects.toBeInstanceOf(WechatApiError);
      expect(mock.callCount).toBe(3);
    });
  });

  describe('postBinary：小程序码', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    it('成功时返回二进制与 content-type', async () => {
      const mock = new MockFetch().enqueueBinary(png);
      const transport = createTransport(mock);

      const result = await transport.postBinary(
        '/wxa/getwxacodeunlimit',
        { scene: 'q=K7P2X9' },
        { access_token: 'tk' },
      );

      expect(result.contentType).toBe('image/png');
      expect(Buffer.compare(result.buffer, png)).toBe(0);
    });

    it('微信以 JSON 返回错误时抛出 WechatApiError（HTTP 200 但内容不是图片）', async () => {
      const mock = new MockFetch().enqueueJson({ errcode: 41030, errmsg: 'page not exist' });
      const transport = createTransport(mock, { maxAttempts: 1 });

      const error = await transport
        .postBinary('/wxa/getwxacodeunlimit', { scene: 'q=1' })
        .catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(41030);
    });

    it('返回 JSON 但没有 errcode 时归一为协议错误', async () => {
      const mock = new MockFetch().enqueueJson({ unexpected: true });
      const transport = createTransport(mock, { maxAttempts: 1 });

      const error = await transport
        .postBinary('/wxa/getwxacodeunlimit', { scene: 'q=1' })
        .catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(-3);
      expect((error as WechatApiError).message).toBe('微信未返回小程序码图片');
    });

    it('原样透传微信返回的 content-type', async () => {
      const mock = new MockFetch().enqueueBinary(Buffer.from([1, 2, 3]), 'image/jpeg');
      const transport = createTransport(mock);

      const result = await transport.postBinary('/wxa/getwxacodeunlimit', { scene: 'q=1' });

      expect(result.contentType).toBe('image/jpeg');
    });
  });

  it('默认使用全局 fetch（不注入 fetchImpl 时也有定义）', () => {
    const transport = new WechatTransport({ apiBaseUrl: 'https://api.weixin.qq.com' });
    expect(transport).toBeInstanceOf(WechatTransport);
  });
});
