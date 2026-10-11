import { describe, expect, it } from 'vitest';
import { AuthConfig, AuthConfigError, parseDurationSeconds } from './auth.config';

const STRONG = {
  JWT_APP_SECRET: 'a'.repeat(40),
  JWT_ADMIN_SECRET: 'b'.repeat(40),
  JWT_HOSPITAL_SECRET: 'c'.repeat(40),
};

const quiet = { ...process.env };

function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { ...quiet, ...overrides };
}

describe('parseDurationSeconds', () => {
  it.each([
    ['45s', 45],
    ['30m', 1800],
    ['2h', 7200],
    ['12h', 43_200],
    ['30d', 2_592_000],
  ])('解析 %s', (input, expected) => {
    expect(parseDurationSeconds(input)).toBe(expected);
  });

  it.each(['1x', 'm', '', '2 h', '-3m', '1.5h'])('非法格式 %s 返回 null', (input) => {
    expect(parseDurationSeconds(input)).toBeNull();
  });
});

describe('AuthConfig', () => {
  it('默认时长：访问 2h、用户端刷新 30d、后台刷新 12h、后台无操作 30m', () => {
    const config = new AuthConfig(env({ NODE_ENV: 'test' }));
    expect(config.accessTtlSeconds).toBe(7200);
    expect(config.appRefreshTtlSeconds).toBe(2_592_000);
    expect(config.staffRefreshTtlSeconds).toBe(43_200);
    expect(config.staffIdleSeconds).toBe(1800);
    expect(config.refreshTtlSeconds('app')).toBe(2_592_000);
    expect(config.refreshTtlSeconds('admin')).toBe(43_200);
    expect(config.refreshTtlSeconds('hospital')).toBe(43_200);
  });

  it('development / test 缺密钥：回退 dev 密钥（不命中：本地可用）', () => {
    const config = new AuthConfig(env({ NODE_ENV: 'test' }));
    expect(config.secrets.app).toContain('dev-insecure');
    expect(config.secrets.admin).not.toBe(config.secrets.app);
  });

  it('staging / production 缺密钥：启动失败（命中）', () => {
    expect(
      () => new AuthConfig(env({ NODE_ENV: 'staging', ...STRONG, JWT_ADMIN_SECRET: undefined })),
    ).toThrow(AuthConfigError);
    expect(
      () =>
        new AuthConfig(env({ NODE_ENV: 'production', ...STRONG, JWT_HOSPITAL_SECRET: undefined })),
    ).toThrow(/JWT_HOSPITAL_SECRET/);
  });

  it('staging 弱密钥（change-me / 过短）：启动失败（命中）', () => {
    expect(
      () =>
        new AuthConfig(env({ NODE_ENV: 'staging', ...STRONG, JWT_APP_SECRET: 'change-me-app' })),
    ).toThrow(AuthConfigError);
    expect(
      () => new AuthConfig(env({ NODE_ENV: 'staging', ...STRONG, JWT_APP_SECRET: 'tooshort' })),
    ).toThrow(AuthConfigError);
  });

  it('staging 三端密钥重复：启动失败（命中，令牌隔离失效）', () => {
    expect(
      () =>
        new AuthConfig(
          env({ NODE_ENV: 'staging', ...STRONG, JWT_ADMIN_SECRET: STRONG.JWT_APP_SECRET }),
        ),
    ).toThrow(AuthConfigError);
  });

  it('dev 三端密钥重复：仅告警不失败（不命中）', () => {
    const config = new AuthConfig(
      env({
        NODE_ENV: 'development',
        JWT_APP_SECRET: 'same'.repeat(10),
        JWT_ADMIN_SECRET: 'same'.repeat(10),
      }),
    );
    expect(config.secrets.app).toBe(config.secrets.admin);
  });

  it('时长格式非法：启动失败', () => {
    expect(() => new AuthConfig(env({ NODE_ENV: 'test', JWT_ACCESS_TTL: '2hours' }))).toThrow(
      AuthConfigError,
    );
  });

  it('未知环境变量取值：校验失败', () => {
    expect(() => new AuthConfig(env({ NODE_ENV: 'uat' }))).toThrow(AuthConfigError);
  });
});
