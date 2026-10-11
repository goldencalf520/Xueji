import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { AUDIENCES, type Audience } from './principal';

/**
 * 令牌与鉴权的环境变量（common/auth 独占，§12.1、§13.5）。变量登记在仓库根目录 .env.example：
 *
 *   JWT_APP_SECRET / JWT_ADMIN_SECRET / JWT_HOSPITAL_SECRET  三端独立签名密钥
 *   JWT_ACCESS_TTL          访问令牌有效期，默认 2h
 *   JWT_APP_REFRESH_TTL     用户端刷新令牌有效期，默认 30d
 *   JWT_STAFF_REFRESH_TTL   后台（admin / hospital）刷新令牌有效期，默认 12h
 *   JWT_STAFF_IDLE_TTL      后台无操作退出时长，默认 30m（§6.2.1）
 *
 * 密钥缺失或非法时 development / test 回退内置 dev 密钥并告警；staging / production 启动即失败
 * （密钥缺失、弱密钥、三端密钥重复都属于启动错误，见 AuthConfigError）。
 */

const DURATION_RE = /^\d+[smhd]$/;
const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86_400 } as const;

/** 解析 '30m' / '2h' / '30d' / '45s' 为秒数；格式非法返回 null */
export function parseDurationSeconds(input: string): number | null {
  if (!DURATION_RE.test(input)) return null;
  const unit = input.slice(-1) as keyof typeof UNIT_SECONDS;
  return Number(input.slice(0, -1)) * UNIT_SECONDS[unit];
}

const zDuration = z.string().regex(DURATION_RE, '时长格式：数字 + s/m/h/d，如 30m、2h、30d');

export const AuthEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  JWT_APP_SECRET: z.string().optional(),
  JWT_ADMIN_SECRET: z.string().optional(),
  JWT_HOSPITAL_SECRET: z.string().optional(),
  JWT_ACCESS_TTL: zDuration.default('2h'),
  JWT_APP_REFRESH_TTL: zDuration.default('30d'),
  JWT_STAFF_REFRESH_TTL: zDuration.default('12h'),
  JWT_STAFF_IDLE_TTL: zDuration.default('30m'),
});
export type AuthEnv = z.infer<typeof AuthEnv>;

/** 令牌配置错误：模块装配期抛出，让进程启动失败 */
export class AuthConfigError extends Error {
  constructor(message: string) {
    super(`令牌与鉴权（common/auth）配置错误：${message}`);
    this.name = 'AuthConfigError';
  }
}

/** development / test 的回退密钥：仅本地使用，与 staging / production 永不兼容 */
const DEV_SECRETS: Record<Audience, string> = {
  app: 'dev-insecure-app-secret-never-use-in-prod-0001',
  admin: 'dev-insecure-admin-secret-never-use-in-prod-01',
  hospital: 'dev-insecure-hospital-secret-never-use-0001',
};

const MIN_SECRET_LENGTH = 32;

const logger = new Logger('AuthConfig');

export class AuthConfig {
  readonly secrets: Readonly<Record<Audience, string>>;
  readonly accessTtlSeconds: number;
  readonly appRefreshTtlSeconds: number;
  readonly staffRefreshTtlSeconds: number;
  readonly staffIdleSeconds: number;

  constructor(source: NodeJS.ProcessEnv = process.env) {
    const parsed = AuthEnv.safeParse(source);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new AuthConfigError(`环境变量校验失败：\n${issues}`);
    }
    const env = parsed.data;
    const strict = env.NODE_ENV === 'staging' || env.NODE_ENV === 'production';

    const wanted: Record<Audience, string | undefined> = {
      app: env.JWT_APP_SECRET,
      admin: env.JWT_ADMIN_SECRET,
      hospital: env.JWT_HOSPITAL_SECRET,
    };
    const secrets = {} as Record<Audience, string>;
    for (const aud of AUDIENCES) {
      const value = wanted[aud];
      const varName = `JWT_${aud.toUpperCase()}_SECRET`;
      if (value === undefined || value.length === 0) {
        if (strict) throw new AuthConfigError(`${varName} 未配置`);
        logger.warn(`${varName} 未配置，回退内置 dev 密钥（仅限本地）`);
        secrets[aud] = DEV_SECRETS[aud];
        continue;
      }
      if (strict && (value.startsWith('change-me') || value.length < MIN_SECRET_LENGTH)) {
        throw new AuthConfigError(
          `${varName} 过弱：staging / production 要求至少 ${MIN_SECRET_LENGTH} 字符且不能是 change-me 占位值`,
        );
      }
      secrets[aud] = value;
    }

    // 三端密钥互不相同是令牌隔离的前提（§12.1），相同则隔离失效
    if (new Set(Object.values(secrets)).size !== AUDIENCES.length) {
      if (strict)
        throw new AuthConfigError(
          'JWT_APP_SECRET / JWT_ADMIN_SECRET / JWT_HOSPITAL_SECRET 互不相同',
        );
      logger.warn('三端签名密钥存在重复，令牌隔离可能失效（仅本地警告）');
    }

    this.secrets = secrets;
    this.accessTtlSeconds = requireSeconds(env.JWT_ACCESS_TTL);
    this.appRefreshTtlSeconds = requireSeconds(env.JWT_APP_REFRESH_TTL);
    this.staffRefreshTtlSeconds = requireSeconds(env.JWT_STAFF_REFRESH_TTL);
    this.staffIdleSeconds = requireSeconds(env.JWT_STAFF_IDLE_TTL);
  }

  /** 该端的刷新令牌有效期（秒） */
  refreshTtlSeconds(aud: Audience): number {
    return aud === 'app' ? this.appRefreshTtlSeconds : this.staffRefreshTtlSeconds;
  }
}

function requireSeconds(input: string): number {
  const seconds = parseDurationSeconds(input);
  if (seconds === null || seconds <= 0) {
    throw new AuthConfigError(`时长配置非法：${input}`);
  }
  return seconds;
}
