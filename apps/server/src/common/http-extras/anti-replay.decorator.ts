import { SetMetadata } from '@nestjs/common';

export const ANTI_REPLAY_KEY = 'xueji:anti-replay';

/**
 * 防重放保护（§14.2）：用于登录、短信、导出等敏感接口。
 * 要求请求携带 `X-Timestamp`（毫秒或秒级 Unix 时间，允许 ±5 分钟时钟偏差）
 * 与 `X-Nonce`（随机数，10 分钟内不得重复）。
 */
export const AntiReplay = () => SetMetadata(ANTI_REPLAY_KEY, true);
