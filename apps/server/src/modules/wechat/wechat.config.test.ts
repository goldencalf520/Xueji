import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WECHAT_API_BASE_URL,
  isWechatConfigured,
  loadWechatEnv,
  resolveMiniprogramState,
} from './wechat.config';

describe('wechat.config', () => {
  it('未配置微信时使用默认值，并判定为未配置（Fake 模式）', () => {
    const env = loadWechatEnv({});

    expect(env.WX_APPID).toBe('');
    expect(env.WX_SECRET).toBe('');
    expect(env.WX_ENV_VERSION).toBe('develop');
    expect(env.WX_API_BASE_URL).toBe(DEFAULT_WECHAT_API_BASE_URL);
    expect(env.NODE_ENV).toBe('development');
    expect(isWechatConfigured(env)).toBe(false);
  });

  it('配置完整时判定为已配置', () => {
    const env = loadWechatEnv({
      WX_APPID: 'wx123',
      WX_SECRET: 'secret',
      WX_ENV_VERSION: 'release',
    });

    expect(isWechatConfigured(env)).toBe(true);
    expect(env.WX_ENV_VERSION).toBe('release');
  });

  it('只配了 WX_APPID 没有 WX_SECRET 时直接报错（不静默用空密钥请求微信）', () => {
    expect(() => loadWechatEnv({ WX_APPID: 'wx123' })).toThrowError(/WX_SECRET/);
  });

  it('WX_ENV_VERSION 取值非法时报错', () => {
    expect(() => loadWechatEnv({ WX_ENV_VERSION: 'production' })).toThrowError(/WX_ENV_VERSION/);
  });

  it('WX_API_BASE_URL 可覆盖（联调 mock / 内网代理）', () => {
    const env = loadWechatEnv({ WX_API_BASE_URL: 'http://127.0.0.1:8080' });

    expect(env.WX_API_BASE_URL).toBe('http://127.0.0.1:8080');
  });

  it('小程序版本映射到订阅消息的 miniprogram_state', () => {
    expect(resolveMiniprogramState('develop')).toBe('developer');
    expect(resolveMiniprogramState('trial')).toBe('trial');
    expect(resolveMiniprogramState('release')).toBe('formal');
  });
});
