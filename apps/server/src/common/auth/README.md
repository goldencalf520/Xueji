# 令牌与鉴权（common/auth）

JWT 三端隔离、刷新令牌轮换与重放检测、全局 AuthGuard（SRV-03，§12.1、§13.5、§6.2.1）。

## 1. 三端隔离

三个端的令牌签发方（`aud`）不同、互不通用，各自持有**独立签名密钥**：

| 端 | 路由前缀 | aud | 访问令牌 | 刷新令牌 |
|---|---|---|---|---|
| 用户端小程序 | `/api/v1/app/**` | `app` | 2 小时 | 30 天 |
| 管理端 | `/api/v1/admin/**` | `admin` | 2 小时 | 12 小时 |
| 医院端 | `/api/v1/hospital/**` | `hospital` | 2 小时 | 12 小时 |
| 回调 / 基础设施 | `/api/v1/webhook/**`、`/api/v1/health` 等 | — | 不鉴权 | — |

`AuthGuard` 按**路由前缀**推断期望的 aud，并用该端密钥验签：跨端令牌必然验签失败，
返回 `40001`。控制器**无需**（也不能）显式声明自己的端：

```ts
// modules/me/me.app.controller.ts —— 文件名与路径前缀即声明
@Controller('app/me')
export class MeAppController { ... }

// modules/staff/staff.admin.controller.ts
@Controller('admin/staff')
export class StaffAdminController { ... }
```

## 2. 装饰器

| 装饰器 | 作用 |
|---|---|
| `@Public()` | 公开接口（登录、验证码等），不校验令牌；方法级 / 类级均可用 |
| `@RequirePhone()` | 需要已绑手机号的正式用户；访客令牌返回 `40011`（仅用户端有意义） |
| `@CurrentUser()` | 取当前身份 `Principal`，支持 `@CurrentUser('staffId')` 取单个字段 |

⚠️ `@CurrentUser()` 是参数装饰器：TC39 装饰器标准不含参数装饰器，Biome 默认拒绝解析。
在控制器参数上使用前，需要 owner 在 biome.json 开启
`javascript.parser.unsafeParameterDecoratorsEnabled`（该文件不归本模块所有，待全局决定；
`@Body()` / `@Query()` 等所有 Nest 参数装饰器同样受此影响）。

## 3. TokenService（业务模块登录成功后调用）

```ts
// 签发：小程序登录（未绑手机号 → 访客令牌）
const pair = await this.tokens.issueTokens({
  aud: 'app', sub: customerId, customerId, guest: !hasPhone,
});

// 轮换：POST /app/auth/refresh（旧刷新令牌换取新的一对）
const pair = await this.tokens.rotateRefreshToken(refreshToken, 'app');

// 吊销：登出全部设备 / 员工停用 / 医院账号停用
await this.tokens.revokeAllFor('admin', staffId);
```

- **轮换**：每次刷新生成新 jti，族内只有最新 jti 有效；
- **重放检测**：旧刷新令牌被再次使用视为泄露，**吊销整个令牌族**，要求重新登录；
- **后台无操作退出**（§6.2.1）：admin / hospital 每次请求记录活动时间（尽力而为），
  刷新时超过 `JWT_STAFF_IDLE_TTL`（默认 30 分钟）吊销族并要求重新登录；用户端不校验。

## 4. 配置（.env）

| 变量 | 默认 | 说明 |
|---|---|---|
| `JWT_APP_SECRET` / `JWT_ADMIN_SECRET` / `JWT_HOSPITAL_SECRET` | dev 回退 | 三端独立签名密钥，staging / production 必须配置且互不相同、至少 32 字符 |
| `JWT_ACCESS_TTL` | `2h` | 访问令牌有效期 |
| `JWT_APP_REFRESH_TTL` | `30d` | 用户端刷新令牌有效期 |
| `JWT_STAFF_REFRESH_TTL` | `12h` | 后台（admin / hospital）刷新令牌有效期 |
| `JWT_STAFF_IDLE_TTL` | `30m` | 后台无操作退出时长 |

development / test 缺密钥回退内置 dev 密钥并告警；staging / production 配置缺失、过弱、
三端重复均启动失败（`AuthConfigError`）。

## 5. 存储（Redis）

| 键 | 内容 | TTL |
|---|---|---|
| `auth:fam:{fam}` | 令牌族：aud / sub / 当前有效 jti / 身份快照 | 刷新令牌有效期（轮换续期） |
| `auth:subj:{aud}:{sub}` | 主体的全部族 ID（吊销全部设备用） | 同上 |
| `auth:act:{aud}:{sub}` | 后台最后活动时间（epoch ms） | 无操作退出时长 |

## 6. 测试

- `auth.config.test.ts`：配置解析与各环境严格性（命中 / 不命中）；
- `token-family.store.test.ts`：族存储语义（假 Redis，无外部依赖）；
- `token.service.test.ts`：三端隔离、过期、typ 混用、轮换、重放吊销族、后台 idle、吊销（safety-critical）；
- `auth.guard.test.ts`：全局守卫 e2e（supertest）：前缀推断、`@Public()`、跨端 40001、访客 40011、
  Principal 回显（用拦截器回显 `request.user`，避免测试代码使用参数装饰器语法）。
