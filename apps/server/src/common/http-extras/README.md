# 接口防护（common/http-extras）

Idempotency-Key 幂等、限流、防重放、游标分页四件套（SRV-01，§12.1 / §14.2）。
全部能力以装饰器 / 工具形式提供，已在 `HttpExtrasModule` 全局注册，业务模块直接 import 装饰器即可：

```ts
import { Idempotent } from '../common/http-extras/idempotent.decorator';
import { RateLimit } from '../common/http-extras/rate-limit.decorator';
import { AntiReplay } from '../common/http-extras/anti-replay.decorator';
import { paginate } from '../common/http-extras/cursor-pagination';
```

## 1. 幂等：`@Idempotent()`

```ts
@Post()
@Idempotent()
create(@Body() dto: CreateOrderDto) { ... }
```

- 读取 `Idempotency-Key` 请求头（1–128 个可打印 ASCII 字符，格式非法返回 40020）；
- 按（aud 路径段, 用户/未登录回退 IP, key）在 Redis 记录首次**成功**响应，保留 24 小时；
- 重复请求直接返回首次的业务数据（逐字段一致；`requestId` 是当次请求的，用于追踪本次日志，
  与 Stripe 幂等回放语义一致），HTTP 状态码与首次相同，响应头带 `X-Idempotent-Replay: true`；
- 首次请求仍在处理中时，重复请求返回 **40900**（HTTP 409）；处理占位 60 秒后自动失效；
- **只缓存成功响应**：业务抛错会释放幂等键，客户端可换键或同键重试；
- 未携带 `Idempotency-Key` 的请求按普通请求处理（幂等是可选增强，不强制）；
- 流式 / 原样输出接口（`@SkipEnvelope()`）不做幂等缓存，不要同时标注。

实现：`idempotency.interceptor.ts`（注册为 `APP_INTERCEPTOR`，位于 `EnvelopeInterceptor` 内层，
缓存与回放的都是业务原始值，由信封拦截器统一包装，不双重包装）。

## 2. 限流：`@RateLimit({ key, limit, windowSec })`

```ts
@Post('sms')
@RateLimit({ key: 'ip', limit: 5, windowSec: 300 })
sendSms() { ... }

@Get()
@RateLimit({ key: 'user', limit: 30, windowSec: 60 })   // 未登录自动回退 IP
list() { ... }
```

- Redis ZSET **滑动窗口**：超限返回 **42900**（HTTP 429）；
- 路由级桶按「路由模板 + 主体」聚合（`/app/x/:id` 聚合成一个桶，路径参数不打散计数）；
- 两层生效：路由级装饰器 → 全局默认限流（按 IP 总量，健康检查 `/api/v1/health` 豁免）。

全局默认限流的环境变量（登记在根 `.env.example`，`http-extras.config.ts` 校验）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `RATE_LIMIT_GLOBAL_ENABLED` | `true` | 关闭后装饰器仍生效 |
| `RATE_LIMIT_GLOBAL_LIMIT` | `300` | 窗口内每 IP 请求总数 |
| `RATE_LIMIT_GLOBAL_WINDOW_SEC` | `60` | 窗口长度（秒） |

> 注意：`key: 'ip'` 依赖 Express 的 `req.ip`。生产在 Nginx 后面时需要设置 `app.set('trust proxy', ...)`
>（由部署 issue INF-01 处理），否则所有限流都按 Nginx 的 IP 计数。

## 3. 防重放：`@AntiReplay()`

```ts
@Post('login')
@AntiReplay()
login() { ... }
```

- 请求头 `X-Timestamp`（毫秒或秒级 Unix 时间均可，自动识别）+ `X-Nonce`（8–128 个可打印 ASCII）；
- 时间戳与服务器时钟偏差超过 **±5 分钟** → 40020；`X-Nonce` **10 分钟**内重复 → 40900；
- 用于登录、短信、导出等敏感接口；客户端每次请求生成新 nonce（uuid / nanoid / 随机串）。

## 4. 游标分页：`encodeCursor / decodeCursor / paginate`

```ts
// 控制器：?cursor=…&limit=20，用 @xueji/shared 的 zCursorQuery 校验
const page = await paginate(prisma.client.customer, {
  where: { status: 'active' },      // 业务过滤，与续读条件 AND 合并
  orderBy: { createdAt: 'desc' },   // 单字段排序；排序值相同时按 id 决胜
  cursor: query.cursor,              // 首页不传
  limit: query.limit,                // 缺省 20，钳制 1–100
});
return page; // { items, nextCursor }，nextCursor=null 表示没有更多
```

- keyset 方式：续读条件 `(sort > 末值) OR (sort = 末值 AND id > 末 id)`，**同一排序值的多条记录
  翻页不重复、不遗漏**；
- 游标是不透明 base64url（内含排序键末值 + 末条 id），无法解码返回 40020；
- 目前只支持**单字段排序**（`orderBy` 恰好一个字段），多字段直接抛错（编程错误）。

## 5. Redis 键与执行顺序

| 能力 | 键 | TTL |
|---|---|---|
| 幂等 | `xueji:idem:{aud}:{principal}:{key}` | 处理中 60s；完成 24h |
| 限流 | `xueji:rl:{r_路由模板_主体 \| g_ip}:{principal}` | 窗口 + 1s |
| nonce | `xueji:nonce:{aud}:{nonce}` | 10 分钟 |

全局执行顺序（CommonModule 的装配顺序决定）：
`RateLimitGuard → AntiReplayGuard → （鉴权 / 权限守卫之后）→ EnvelopeInterceptor → IdempotencyInterceptor → handler`（响应方向相反：幂等拦截器先拿到业务原始值缓存，再由信封包装发送）。

## 6. 测试

`*.test.ts` 与代码同目录，不需要真实 Redis / MySQL（`testing/fake-redis.ts` 实现命令子集）：

- 单元：各装饰器命 / 不命中、并发 40900、窗口滑动恢复、TTL、键空间隔离；
- 集成：`http-extras.e2e.test.ts` 用 `CommonModule` + supertest 验证全局装配、
  信封顺序（回放不双重包装）、HTTP 状态码与错误码。
