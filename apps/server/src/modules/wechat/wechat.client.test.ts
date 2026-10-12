import { ErrorCode } from '@xueji/shared';
import { describe, expect, it, vi } from 'vitest';
import { BizException } from '../../common/errors/biz.exception';
import { MemoryTokenStore } from './testing/memory-token-store';
import { MockFetch } from './testing/mock-fetch';
import type { WechatEnv } from './wechat.config';
import { WECHAT_UNEXPECTED_RESPONSE_CODE, WechatApiError } from './wechat.errors';
import { createWechatClient, defaultWechatLogger } from './wechat.factory';
import { WechatFakeClient } from './wechat.fake.client';
import { WechatRealClient } from './wechat.real.client';
import { WechatClient } from './wechat.types';

/**
 * WechatClient 契约测试（SRV-10 / #29）：用 HTTP mock 覆盖每个方法与令牌过期重试，
 * 以及「WX_APPID 为空 → Fake」的装配分支。不连真实微信、不连 Redis。
 */

const REAL_ENV: WechatEnv = {
  NODE_ENV: 'development',
  WX_APPID: 'wx-test-appid',
  WX_SECRET: 'wx-test-secret',
  WX_ENV_VERSION: 'develop',
  WX_API_BASE_URL: 'https://api.weixin.qq.com',
};

const FAKE_ENV: WechatEnv = { ...REAL_ENV, WX_APPID: '', WX_SECRET: '' };

/** 不等待的重试退避：让重试逻辑在测试里是确定且零耗时的 */
const noSleep = async () => {};

const silentLogger = { debug: () => {}, warn: () => {} };

const TOKEN_OK = { access_token: 'tk-1', expires_in: 7200 };
const PHONE_OK = {
  errcode: 0,
  phone_info: {
    phoneNumber: '+8613800000001',
    purePhoneNumber: '13800000001',
    countryCode: '86',
  },
};

function createRealClient(mock: MockFetch, store = new MemoryTokenStore()) {
  const client = createWechatClient({
    env: REAL_ENV,
    store,
    fetchImpl: mock.fetch,
    sleep: noSleep,
    logger: silentLogger,
  });
  if (!(client instanceof WechatRealClient)) throw new Error('应当装配出 WechatRealClient');
  return { client, store };
}

/** 断言请求路径与 query（避免把 appid / secret 拼错的低级回归） */
function pathOf(url: string): string {
  return new URL(url).pathname;
}

describe('wechat.client（真实实现）', () => {
  describe('code2Session', () => {
    it('用 code 换 openid / session_key / unionid，且不需要 access_token', async () => {
      const mock = new MockFetch().enqueueJson({
        openid: 'openid-1',
        session_key: 'sk-1',
        unionid: 'unionid-1',
      });
      const { client } = createRealClient(mock);

      const session = await client.code2Session('js-code-1');

      expect(session).toEqual({ openid: 'openid-1', sessionKey: 'sk-1', unionid: 'unionid-1' });
      expect(mock.callCount).toBe(1); // 只有一次请求：code2Session 不用 access_token
      const url = new URL(mock.lastUrl());
      expect(url.pathname).toBe('/sns/jscode2session');
      expect(url.searchParams.get('appid')).toBe('wx-test-appid');
      expect(url.searchParams.get('secret')).toBe('wx-test-secret');
      expect(url.searchParams.get('js_code')).toBe('js-code-1');
      expect(url.searchParams.get('grant_type')).toBe('authorization_code');
    });

    it('没有 unionid 时不返回该字段', async () => {
      const mock = new MockFetch().enqueueJson({ openid: 'openid-1', session_key: 'sk-1' });
      const { client } = createRealClient(mock);

      const session = await client.code2Session('js-code-1');

      expect(session).toEqual({ openid: 'openid-1', sessionKey: 'sk-1' });
      expect('unionid' in session).toBe(false);
    });

    it('微信返回 errcode 时抛出对应错误码（不吞错、不重试）', async () => {
      const mock = new MockFetch().enqueueJson({ errcode: 40029, errmsg: 'invalid code' });
      const { client } = createRealClient(mock);

      const error = await client.code2Session('bad-code').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(WechatApiError);
      expect((error as WechatApiError).errcode).toBe(40029);
      expect(mock.callCount).toBe(1);
    });

    it('缺少 openid / session_key 时按「响应不可识别」处理', async () => {
      const mock = new MockFetch().enqueueJson({ session_key: 'sk-1' });
      const { client } = createRealClient(mock);

      const error = await client.code2Session('js-code-1').catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(WECHAT_UNEXPECTED_RESPONSE_CODE);
    });
  });

  describe('getPhoneNumber', () => {
    it('先取 access_token 再用 code 换手机号', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueJson(PHONE_OK);
      const { client } = createRealClient(mock);

      const info = await client.getPhoneNumber('phone-code-1');

      expect(info).toEqual({
        phoneNumber: '+8613800000001',
        purePhoneNumber: '13800000001',
        countryCode: '86',
      });
      expect(pathOf(mock.calls[0]?.url ?? '')).toBe('/cgi-bin/token');
      expect(pathOf(mock.lastUrl())).toBe('/wxa/business/getuserphonenumber');
      expect(new URL(mock.lastUrl()).searchParams.get('access_token')).toBe('tk-1');
      expect(mock.lastJsonBody()).toEqual({ code: 'phone-code-1' });
    });

    it('countryCode 缺失时回落为空串', async () => {
      const mock = new MockFetch()
        .enqueueJson(TOKEN_OK)
        .enqueueJson({ errcode: 0, phone_info: { phoneNumber: '+8613', purePhoneNumber: '13' } });
      const { client } = createRealClient(mock);

      const info = await client.getPhoneNumber('phone-code-1');

      expect(info.countryCode).toBe('');
    });

    it('access_token 失效时刷新令牌并只重试一次', async () => {
      const mock = new MockFetch()
        .enqueueJson(TOKEN_OK)
        .enqueueJson({ errcode: 40001, errmsg: 'invalid credential' })
        .enqueueJson({ access_token: 'tk-2', expires_in: 7200 })
        .enqueueJson(PHONE_OK);
      const { client, store } = createRealClient(mock);

      const info = await client.getPhoneNumber('phone-code-1');

      expect(info.purePhoneNumber).toBe('13800000001');
      expect(mock.callCount).toBe(4);
      expect(new URL(mock.lastUrl()).searchParams.get('access_token')).toBe('tk-2');
      // 缓存里已经换成新令牌
      expect(await store.get('xueji:wechat:access_token:wx-test-appid')).toBe('tk-2');
    });

    it('重试后仍失效则抛错，不会无限重试', async () => {
      const mock = new MockFetch()
        .enqueueJson(TOKEN_OK)
        .enqueueJson({ errcode: 40001 })
        .enqueueJson({ access_token: 'tk-2', expires_in: 7200 })
        .enqueueJson({ errcode: 40001 });
      const { client } = createRealClient(mock);

      const error = await client.getPhoneNumber('phone-code-1').catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(40001);
      expect(mock.callCount).toBe(4);
    });

    it('非令牌类错误不触发刷新', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueJson({ errcode: 40013 });
      const { client } = createRealClient(mock);

      const error = await client.getPhoneNumber('phone-code-1').catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(40013);
      expect(mock.callCount).toBe(2);
    });

    it('令牌接口没返回 access_token 时报错', async () => {
      const mock = new MockFetch().enqueueJson({ errcode: 0 });
      const { client } = createRealClient(mock);

      const error = await client.getPhoneNumber('phone-code-1').catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(WECHAT_UNEXPECTED_RESPONSE_CODE);
    });
  });

  describe('sendSubscribeMessage', () => {
    it('按订阅消息协议发送，缺省 miniprogram_state 由 WX_ENV_VERSION 推断', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueJson({ errcode: 0 });
      const { client } = createRealClient(mock);

      await client.sendSubscribeMessage({
        openid: 'openid-1',
        templateId: 'tpl-1',
        page: 'pages/index/index',
        data: { thing1: { value: '体检提醒' } },
      });

      expect(pathOf(mock.lastUrl())).toBe('/cgi-bin/message/subscribe/send');
      const body = mock.lastJsonBody() as Record<string, unknown>;
      expect(body).toEqual({
        touser: 'openid-1',
        template_id: 'tpl-1',
        miniprogram_state: 'developer',
        data: { thing1: { value: '体检提醒' } },
        page: 'pages/index/index',
      });
      expect('lang' in body).toBe(false);
    });

    it('显式传入 miniprogramState / lang 时以传入值为准', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueJson({ errcode: 0 });
      const { client } = createRealClient(mock);

      await client.sendSubscribeMessage({
        openid: 'openid-1',
        templateId: 'tpl-1',
        data: { thing1: { value: 'x' } },
        miniprogramState: 'formal',
        lang: 'zh_CN',
      });

      const body = mock.lastJsonBody() as Record<string, unknown>;
      expect(body.miniprogram_state).toBe('formal');
      expect(body.lang).toBe('zh_CN');
    });

    it('用户未订阅（43101）原样抛出，调用方按业务语义处理', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueJson({ errcode: 43101 });
      const { client } = createRealClient(mock);

      const error = await client
        .sendSubscribeMessage({
          openid: 'openid-1',
          templateId: 'tpl-1',
          data: {},
        })
        .catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(43101);
      expect((error as WechatApiError).tokenInvalid).toBe(false);
      expect(mock.callCount).toBe(2);
    });

    it('可重试错误也不重发（订阅消息非幂等）', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueJson({ errcode: -1 });
      const { client } = createRealClient(mock);

      const error = await client
        .sendSubscribeMessage({
          openid: 'openid-1',
          templateId: 'tpl-1',
          data: {},
        })
        .catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(-1);
      expect(mock.callCount).toBe(2); // 没有第二次发送
    });
  });

  describe('getUnlimitedQrcode', () => {
    const PNG = Buffer.from('fake-png-bytes');

    it('返回 PNG 二进制；develop 版本默认不校验 page', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueBinary(PNG);
      const { client } = createRealClient(mock);

      const result = await client.getUnlimitedQrcode({ scene: 'q=K7P2X9' });

      expect(result.buffer.equals(PNG)).toBe(true);
      expect(result.contentType).toBe('image/png');
      expect(pathOf(mock.lastUrl())).toBe('/wxa/getwxacodeunlimit');
      expect(new URL(mock.lastUrl()).searchParams.get('access_token')).toBe('tk-1');
      expect(mock.lastJsonBody()).toEqual({
        scene: 'q=K7P2X9',
        env_version: 'develop',
        check_path: false,
      });
    });

    it('release 版本默认校验 page，并可传入 page / width', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueBinary(PNG);
      const { client } = createRealClient(mock);

      await client.getUnlimitedQrcode({
        scene: 'q=K7P2X9',
        page: 'pkg-quiz/pages/index',
        width: 430,
        envVersion: 'release',
      });

      expect(mock.lastJsonBody()).toEqual({
        scene: 'q=K7P2X9',
        env_version: 'release',
        check_path: true,
        page: 'pkg-quiz/pages/index',
        width: 430,
      });
    });

    it('scene 超长 / 为空是调用方参数错误：抛 40020 且不消耗微信配额', async () => {
      const mock = new MockFetch();
      const { client } = createRealClient(mock);

      const tooLong = await client
        .getUnlimitedQrcode({ scene: 'x'.repeat(33) })
        .catch((e: unknown) => e);
      const empty = await client.getUnlimitedQrcode({ scene: '' }).catch((e: unknown) => e);

      expect(tooLong).toBeInstanceOf(BizException);
      expect((tooLong as BizException).code).toBe(ErrorCode.INVALID_PARAMS);
      expect((empty as BizException).code).toBe(ErrorCode.INVALID_PARAMS);
      expect(mock.callCount).toBe(0);
    });

    it('scene 恰好 32 字符是允许的边界', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueBinary(PNG);
      const { client } = createRealClient(mock);

      await expect(client.getUnlimitedQrcode({ scene: 'x'.repeat(32) })).resolves.toBeDefined();
    });

    it('微信以 JSON 返回错误（HTTP 200）时按错误处理', async () => {
      const mock = new MockFetch().enqueueJson(TOKEN_OK).enqueueJson({ errcode: 41030 });
      const { client } = createRealClient(mock);

      const error = await client.getUnlimitedQrcode({ scene: 'q=K7P2X9' }).catch((e: unknown) => e);

      expect((error as WechatApiError).errcode).toBe(41030);
    });
  });

  describe('令牌缓存', () => {
    it('缓存命中时不再请求令牌接口', async () => {
      const store = new MemoryTokenStore();
      store.seed('xueji:wechat:access_token:wx-test-appid', 'tk-cached');
      const mock = new MockFetch().enqueueJson(PHONE_OK);
      const { client } = createRealClient(mock, store);

      await client.getPhoneNumber('phone-code-1');

      expect(mock.callCount).toBe(1);
      expect(new URL(mock.lastUrl()).searchParams.get('access_token')).toBe('tk-cached');
    });
  });
});

describe('wechat.client（Fake 实现）', () => {
  it('同一 code 派生同一个 openid / session_key，便于联调与断言', async () => {
    const client = new WechatFakeClient();

    const first = await client.code2Session('js-code-1');
    const again = await client.code2Session('js-code-1');
    const other = await client.code2Session('js-code-2');

    expect(first).toEqual(again);
    expect(first.openid).not.toBe(other.openid);
    expect(first.openid.startsWith('fake-openid-')).toBe(true);
  });

  it('空 code 直接报错，避免掩盖前端漏传参数', async () => {
    const client = new WechatFakeClient();

    await expect(client.code2Session('  ')).rejects.toThrow();
  });

  it('手机号是固定假号（不得使用真实客户数据）', async () => {
    const client = new WechatFakeClient();

    const info = await client.getPhoneNumber('phone-code-1');

    expect(info).toEqual({
      phoneNumber: '+8613900000000',
      purePhoneNumber: '13900000000',
      countryCode: '86',
    });
    await expect(client.getPhoneNumber('')).rejects.toThrow();
  });

  it('订阅消息只记录到内存，不真的发给用户', async () => {
    const client = new WechatFakeClient();

    await client.sendSubscribeMessage({ openid: 'o1', templateId: 'tpl-1', data: {} });

    expect(client.sentMessages).toHaveLength(1);
    expect(client.sentMessages[0]?.templateId).toBe('tpl-1');
  });

  it('小程序码返回 PNG 占位图，scene 越界同样抛 40020', async () => {
    const client = new WechatFakeClient();

    const result = await client.getUnlimitedQrcode({ scene: 'q=K7P2X9' });

    expect(result.contentType).toBe('image/png');
    expect(result.buffer.length).toBeGreaterThan(0);
    await expect(client.getUnlimitedQrcode({ scene: 'x'.repeat(33) })).rejects.toBeInstanceOf(
      BizException,
    );
  });
});

describe('wechat.factory（装配）', () => {
  it('WX_APPID 为空时启用 Fake 实现并给出告警（本地开发免连微信）', () => {
    const warn = vi.fn();
    const client = createWechatClient({ env: FAKE_ENV, logger: { debug: () => {}, warn } });

    expect(client).toBeInstanceOf(WechatFakeClient);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('生产环境没配 WX_APPID 直接报错（禁止悄悄用假 openid 登录）', () => {
    expect(() => createWechatClient({ env: { ...FAKE_ENV, NODE_ENV: 'production' } })).toThrow(
      /禁止启用 Fake/,
    );
  });

  it('配了 WX_APPID 但没有令牌存储时报错', () => {
    expect(() => createWechatClient({ env: REAL_ENV })).toThrow(/需要令牌存储/);
  });

  it('配了 WX_APPID 与令牌存储时装配真实实现', () => {
    const client = createWechatClient({
      env: REAL_ENV,
      store: new MemoryTokenStore(),
      fetchImpl: new MockFetch().fetch,
      sleep: noSleep,
      logger: silentLogger,
    });

    expect(client).toBeInstanceOf(WechatRealClient);
    expect(client).toBeInstanceOf(WechatClient);
  });

  it('Fake 模式下 dev 登录流程可以走通（code2Session → getPhoneNumber）', async () => {
    const client = createWechatClient({ env: FAKE_ENV, logger: silentLogger });

    const session = await client.code2Session('dev-login-code');
    const phone = await client.getPhoneNumber('dev-phone-code');

    expect(session.openid).toBeTruthy();
    expect(session.sessionKey).toBeTruthy();
    expect(phone.purePhoneNumber).toBe('13900000000');
  });

  it('默认日志实现提供 debug / warn（不打印令牌）', () => {
    const logger = defaultWechatLogger();

    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });
});
