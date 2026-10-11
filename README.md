# 雪姬六维健康平台（XXX-Health）

面向雪姬美业客户（以乐龄女性为主）的健康美学平台：游戏化六维测评、免费体检与合作医院转介、
规则引擎生成的门店养护方案、个人健康档案、会员分级权益、魔镜 AI 陪伴。

| 端 | 形态 | 代码 |
|---|---|---|
| 用户端 | 微信小程序（客户、家人），支持乐龄模式 | `apps/miniapp` |
| 管理端 | Web（总部、店长、顾问、健康顾问、财务） | `apps/admin` → `admin.html` |
| 顾问移动工作台 | 企业微信内 H5 | `apps/admin` → `mobile.html` |
| 医院端 | Web（合作医院协调员、医生） | `apps/admin` → `hospital.html` |
| 平台服务 | NestJS（api + worker） | `apps/server` |

- 产品文档：[docs/product/产品设计与开发文档_v1.0.md](docs/product/产品设计与开发文档_v1.0.md)
- 架构总览：[docs/architecture/README.md](docs/architecture/README.md)
- 小程序设计规范：[docs/design/miniapp-ui.md](docs/design/miniapp-ui.md)
- **协作协议（agent 必读）**：[AGENTS.md](AGENTS.md)

## 技术栈

Node.js 24 · pnpm 10 + Turborepo · TypeScript 5.9 · NestJS 11 · Prisma 7（MySQL 8）· Redis 7 + BullMQ ·
Vue 3.5 + Vite 8 + Element Plus / Vant · uni-app 3（Vue 3.4）+ wot-design-uni · zod 4 · Vitest · Biome。
选型理由与版本约束见 [ADR 0001](docs/architecture/adr/0001-技术栈与版本.md)。

## 快速开始

```bash
corepack enable
pnpm install
cp .env.example apps/server/.env
pnpm db:up          # 本地 MySQL / Redis / MinIO（需要 Docker）
pnpm build          # 先构建 packages/*，再构建各应用
pnpm dev:server     # http://localhost:3000/api/v1/health ，接口文档 /api/docs
pnpm dev:admin      # http://localhost:5173/admin.html · /hospital.html · /mobile.html
pnpm dev:miniapp    # 产物 apps/miniapp/dist/dev/mp-weixin，用微信开发者工具导入
```

常用命令：

| 命令 | 作用 |
|---|---|
| `pnpm check` | lint + typecheck + test（提交前必跑） |
| `pnpm db:migrate --name <issue>_<简述>` | 生成并执行迁移 |
| `pnpm db:seed` | 执行 `apps/server/prisma/seed/*.seed.ts` |
| `pnpm --filter @xueji/server test:e2e` | 接口测试（需要数据库） |

## 开发方式

所有功能都以 GitHub issue 形式拆分，按 `wave:N` 标签分批并行开发；每个 issue 声明「独占路径」，
保证多个 agent 同时开发互不冲突。认领、开发、提交流程见 [AGENTS.md](AGENTS.md)，issue 与目录的对应关系见
[docs/architecture/ownership.md](docs/architecture/ownership.md)。
