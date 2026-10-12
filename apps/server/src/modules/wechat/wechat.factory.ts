import { Logger } from '@nestjs/common';
import type {
  WechatAccessTokenProvider,
  WechatAccessTokenResponse,
  WechatLogger,
} from './wechat.access-token';
import { WechatAccessTokenProvider as TokenProvider } from './wechat.access-token';
import {
  isWechatConfigured,
  loadWechatEnv,
  WECHAT_TOKEN_KEY_PREFIX,
  WECHAT_TOKEN_LOCK_KEY_PREFIX,
  type WechatEnv,
} from './wechat.config';
import { WECHAT_UNEXPECTED_RESPONSE_CODE, WechatApiError } from './wechat.errors';
import { WechatFakeClient } from './wechat.fake.client';
import { WechatRealClient } from './wechat.real.client';
import type { WechatTokenStore } from './wechat.token-store';
import { type WechatFetch, WechatTransport } from './wechat.transport';
import type { WechatClient } from './wechat.types';

/**
 * 微信 SDK 的装配（SRV-10 / #29）：按 `WX_APPID` 是否为真实选择实现。
 *
 * 装配逻辑写成普通函数（而不是 Nest 工厂），好处是单元测试可以直接构造真实客户端并注入
 * HTTP mock，不需要起完整应用。
 */

export interface CreateWechatClientOptions {
  env?: WechatEnv;
  /** 真实模式必需：令牌存储（生产用 RedisWechatTokenStore） */
  store?: WechatTokenStore;
  /** 注入 fetch（测试用 HTTP mock） */
  fetchImpl?: WechatFetch;
  /** 注入重试等待（测试里零耗时） */
  sleep?: (ms: number) => Promise<void>;
  logger?: WechatLogger;
}

export function createWechatClient(options: CreateWechatClientOptions = {}): WechatClient {
  const env = options.env ?? loadWechatEnv();

  if (!isWechatConfigured(env)) {
    if (env.NODE_ENV === 'production') {
      // 生产环境静默使用 Fake 会造成「登录拿到了假 openid」这类事故，必须直接失败
      throw new Error('生产环境必须配置 WX_APPID 与 WX_SECRET，禁止启用 Fake 微信 SDK');
    }
    options.logger?.warn('WX_APPID 未配置，微信 SDK 使用 Fake 实现（仅限本地开发与测试）');
    return new WechatFakeClient();
  }

  if (!options.store) {
    throw new Error('已配置 WX_APPID，微信 SDK 需要令牌存储（RedisWechatTokenStore）');
  }

  const transport = new WechatTransport({
    apiBaseUrl: env.WX_API_BASE_URL,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.sleep ? { sleep: options.sleep } : {}),
  });
  const tokens: WechatAccessTokenProvider = new TokenProvider({
    store: options.store,
    fetchToken: () => fetchAccessToken(transport, env),
    cacheKey: `${WECHAT_TOKEN_KEY_PREFIX}:${env.WX_APPID}`,
    lockKey: `${WECHAT_TOKEN_LOCK_KEY_PREFIX}:${env.WX_APPID}`,
    ...(options.logger ? { logger: options.logger } : {}),
  });
  return new WechatRealClient(transport, tokens, env, options.logger);
}

/** 稳定版 access_token（§8）：缓存与锁的键都按 appid 隔离，多小程序可共存 */
async function fetchAccessToken(
  transport: WechatTransport,
  env: WechatEnv,
): Promise<WechatAccessTokenResponse> {
  const raw = await transport.getJson<{ access_token?: string; expires_in?: number }>(
    '/cgi-bin/token',
    {
      grant_type: 'client_credential',
      appid: env.WX_APPID,
      secret: env.WX_SECRET,
    },
  );
  if (!raw.access_token) {
    throw new WechatApiError(WECHAT_UNEXPECTED_RESPONSE_CODE, '微信未返回 access_token');
  }
  return { accessToken: raw.access_token, expiresIn: Number(raw.expires_in ?? 7200) };
}

/** 默认日志实现（Nest Logger → pino），只记录语义信息，不打印令牌 */
export function defaultWechatLogger(): WechatLogger {
  return new Logger('WechatClient');
}
