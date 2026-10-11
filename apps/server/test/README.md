# 接口 / 端到端测试

- 文件命名 `*.e2e.ts`，运行 `pnpm --filter @xueji/server test:e2e`。
- 需要本地 MySQL 与 Redis：仓库根目录 `pnpm db:up`，并设置 `DATABASE_URL`、`REDIS_URL`。
- 越权测试（§17.2）统一放在 `test/authz/`，按端分文件：`app.e2e.ts`、`admin.e2e.ts`、`hospital.e2e.ts`。
- 单元测试与被测代码放在一起（`src/**/*.test.ts`），不需要数据库。
