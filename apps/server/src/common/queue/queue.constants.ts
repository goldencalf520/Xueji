/**
 * 队列与定时任务的公共常量（SRV-08）。
 *
 * 队列名、任务名统一用小写点分名（如 `consumption.import`、`alert.escalate`），与产品文档
 * §13.5「定时与异步任务」清单保持一致，便于在日志与 Bull Board 里定位。
 */

/** 未显式指定队列时的默认队列名 */
export const DEFAULT_QUEUE_NAME = 'default';

/** 定时任务默认时区：业务日期一律按北京时间计算（ADR 0001 平台约束 2） */
export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

/** 默认尝试次数（含首次执行）：最多执行 3 次 */
export const DEFAULT_JOB_ATTEMPTS = 3;

/** 默认退避：指数退避，首次延迟 5s */
export const DEFAULT_BACKOFF_DELAY_MS = 5_000;

/** 完成 / 失败任务的默认保留条数，避免 Redis 无限增长 */
export const DEFAULT_KEEP_COMPLETED = 1_000;
export const DEFAULT_KEEP_FAILED = 5_000;

/** 定时任务 scheduler id 前缀：`cron:<name>`，同一 id 重复 upsert 幂等，多实例不会重复注册 */
export const CRON_SCHEDULER_PREFIX = 'cron';
