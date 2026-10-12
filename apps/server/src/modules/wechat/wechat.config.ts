import { z } from 'zod';
import type { WechatEnvVersion, WechatMiniprogramState } from './wechat.types';

/**
 * 微信小程序 SDK 的环境变量（变量名登记在仓库根 .env.example 的「微信小程序」分组）。
 *
 * 与 `src/config/app.config.ts` 的分工：那里只放所有进程都要的核心变量，业务模块的配置在自己目录内校验。
 */

export const DEFAULT_WECHAT_API_BASE_URL = 'https://api.weixin.qq.com';

/** 稳定版 access_token 有效期 7200s；提前 300s 刷新，避免边界上刚好失效 */
export const WECHAT_TOKEN_EARLY_REFRESH_SEC = 300;
/** 缓存 TTL 下限：微信给出再短的有效期也不会比这个更频繁地刷新，避免刷爆接口配额 */
export const WECHAT_TOKEN_MIN_TTL_SEC = 60;
/** 刷新 access_token 的分布式锁 TTL（秒）：抢不到锁的进程等锁释放后直接读缓存 */
export const WECHAT_TOKEN_LOCK_TTL_SEC = 10;
/** 抢不到锁时等待缓存回填的总时长与轮询间隔 */
export const WECHAT_TOKEN_WAIT_TIMEOUT_MS = 3000;
export const WECHAT_TOKEN_WAIT_INTERVAL_MS = 50;
/** 单次 HTTP 请求超时（小程序码生成较慢，留 8s） */
export const WECHAT_HTTP_TIMEOUT_MS = 8000;
/** 可重试错误的最大尝试次数（含首次） */
export const WECHAT_HTTP_MAX_ATTEMPTS = 3;
/** 退避基数（毫秒）：第 n 次重试前等待 n × 该值 */
export const WECHAT_HTTP_RETRY_DELAY_MS = 200;

/** Redis 键前缀（与 common/http-extras 的 `xueji:` 命名一致），后面接 appid */
export const WECHAT_TOKEN_KEY_PREFIX = 'xueji:wechat:access_token';
export const WECHAT_TOKEN_LOCK_KEY_PREFIX = 'xueji:wechat:access_token:lock';

export const WechatEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  /** 为空表示未配置微信：启用 Fake 实现（仅限 dev / staging，production 直接报错） */
  WX_APPID: z.string().trim().default(''),
  WX_SECRET: z.string().trim().default(''),
  /** 小程序版本：develop 开发版 / trial 体验版 / release 正式版 */
  WX_ENV_VERSION: z.enum(['develop', 'trial', 'release']).default('develop'),
  /** 覆盖微信接口地址（联调 mock、内网代理用），生产保持默认 */
  WX_API_BASE_URL: z.string().trim().default(DEFAULT_WECHAT_API_BASE_URL),
});
export type WechatEnv = z.infer<typeof WechatEnv>;

export function loadWechatEnv(source: NodeJS.ProcessEnv = process.env): WechatEnv {
  const parsed = WechatEnv.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`微信 SDK 环境变量校验失败：\n${issues}`);
  }
  const env = parsed.data;
  if (env.WX_APPID !== '' && env.WX_SECRET === '') {
    throw new Error(
      '微信 SDK 环境变量校验失败：\n  - WX_SECRET: 配置了 WX_APPID 时必须同时提供 WX_SECRET',
    );
  }
  return env;
}

/** 是否已配置微信：未配置时启用 Fake 实现 */
export function isWechatConfigured(env: Pick<WechatEnv, 'WX_APPID'>): boolean {
  return env.WX_APPID !== '';
}

/** 小程序版本 → 订阅消息的 miniprogram_state */
export function resolveMiniprogramState(envVersion: WechatEnvVersion): WechatMiniprogramState {
  switch (envVersion) {
    case 'develop':
      return 'developer';
    case 'trial':
      return 'trial';
    case 'release':
      return 'formal';
  }
}
