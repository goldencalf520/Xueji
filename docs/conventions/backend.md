# 服务端约定（apps/server）

## 模块目录结构

```text
src/modules/<模块>/
├── <模块>.module.ts              已预注册的占位模块，实现时补充 providers / controllers / imports
├── <模块>.app.controller.ts      用户端接口（/app/...）
├── <模块>.admin.controller.ts    管理端接口（/admin/...）
├── <模块>.hospital.controller.ts 医院端接口（/hospital/...）
├── <模块>.service.ts             业务逻辑（可拆多个 service）
├── <模块>.repository.ts          可选：复杂查询、数据范围注入
├── events.ts                     本模块发布的领域事件（事件名常量 + payload 类型）
├── jobs/                         BullMQ 处理器与定时任务（只在 worker 进程注册）
├── config.ts                     本模块的环境变量 zod schema（变量名登记在根 .env.example）
└── *.test.ts                     单元测试（与代码放一起）
```

## 规则

1. **只改自己模块的目录**和自己域的 `prisma/schema/<域>.prisma`、`packages/shared/src/contracts/<域>.ts`、`prisma/seed/<序号>-<域>.seed.ts`。
2. 控制器只做参数接收、守卫与装饰器声明；业务逻辑在 service；不要在控制器里直接用 Prisma。
3. 所有输入用契约 zod schema 校验（`createZodDto`）；不要手写 class-validator。
4. 跨模块：
   - 读别的域数据 → import 对方 Module，注入其导出的 Service；**不要直接查别的域的表**；
   - 通知别的域发生了什么 → 发布领域事件（`this.events.emit('consent.revoked', payload)`），订阅方用 `@OnEvent`；
   - 出现循环依赖 → 改用事件，不要用 `forwardRef`。
5. 健康数据接口：`@Permission(...)` + `@Audit('health.view')`，并经过数据范围过滤。
6. 时间：业务日期用 `Asia/Shanghai` 计算，存储与比较用 UTC `Date`。把"当前时间"作为参数传入纯函数，便于测试。
7. 金额用 `Prisma.Decimal`，不要用 number 做加减。
8. 日志：用 Nest `Logger`（底层 pino），**不得打印手机号、姓名、健康数据、令牌**。
9. 第三方调用（微信、企微、AI、COS、短信）只通过对应的 SDK 模块（`wechat`、`wecom`、`ai`、`file`、`notify`），测试时 mock 这些模块。

## 测试

- 单元测试：`src/**/*.test.ts`，`pnpm --filter @xueji/server test`，不依赖数据库；
- 接口测试：`test/**/*.e2e.ts`，需要 `pnpm db:up`，运行 `pnpm --filter @xueji/server test:e2e`；
- 用 `Test.createTestingModule({ imports: [CommonModule, XxxModule] })` + `createApp()` 构造应用，保证与线上行为一致（见 `modules/health/health.controller.test.ts`）。
