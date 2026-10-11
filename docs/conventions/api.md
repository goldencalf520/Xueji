# 接口约定（对应 §12.1）

| 项目 | 约定 |
|---|---|
| 前缀 | 用户端 `/api/v1/app`、管理端 `/api/v1/admin`、医院端 `/api/v1/hospital`、回调 `/api/v1/webhook` |
| 鉴权 | `Authorization: Bearer <JWT>`；访问令牌 2 小时；刷新令牌：用户端 30 天、后台 / 医院端 12 小时；三端 `aud` 不同、互不通用 |
| 响应 | `{ code, message, data, requestId }`，错误码见 `@xueji/shared` 的 `ErrorCode` |
| ID | BIGINT 一律序列化为**字符串** |
| 时间 | ISO 8601 带时区：`2026-10-10T09:30:00+08:00`；日期 `YYYY-MM-DD` |
| 分页 | 游标：`?cursor=…&limit=20`，返回 `{ items, nextCursor }`（`zCursorQuery` / `zCursorPage`） |
| 幂等 | 创建类接口支持 `Idempotency-Key` 请求头，24 小时内重复请求返回首次结果 |
| 部分更新 | **用户端用 PUT**（`wx.request` 不支持 PATCH）；管理端 / 医院端可用 PATCH |
| 流式 | 魔镜回复用 HTTP chunked，控制器加 `@SkipEnvelope()`；小程序用 `wx.request` 的 `enableChunked` 接收 |
| 文档 | 由代码自动生成 OpenAPI：`/api/docs`（生产关闭） |

## 契约文件

- 每个域一个 `packages/shared/src/contracts/<域>.ts`，**由该域后端 issue 独占维护**；
- 用 zod 定义请求 / 响应，导出 schema 与 `z.infer` 类型；服务端 `createZodDto(schema)`，前端直接 import 类型；
- 文件名与服务端模块目录名一致（如 `contracts/consent.ts` ↔ `modules/consent/`）；
- 前台展示用的文案、枚举名称从 `@xueji/shared` 取，不在前端重复定义。

## 错误处理

- 服务层抛 `BizException(ErrorCode.X, '面向用户的说明')`；
- 缺少授权：`throw BizException.consentRequired('C3', { hospitalId })`，前端跳转 P-06 授权页；
- 不要把内部错误信息（SQL、堆栈、第三方返回）放进 message；5xx 只返回通用文案和 requestId。

## 越权测试要求（§17.2）

每个新接口至少覆盖：未登录 → 40001；其它端令牌 → 40001；无权限角色 → 40003；数据范围外的记录 → 40003 / 40400。
