# AGENTS.md — 多 agent 协作协议

本仓库的全部实现工作都拆成了 GitHub issue，由多个 agent（或开发者）并行认领。
**开工前完整阅读本文件**，然后按顺序阅读：

1. [`docs/architecture/README.md`](docs/architecture/README.md) — 系统组成、目录结构、请求链路、安全不变量
2. [`docs/architecture/adr/`](docs/architecture/adr/) — 技术栈与版本、代码所有权、数据库与迁移
3. [`docs/conventions/`](docs/conventions/) — 接口、服务端、前端约定
4. 你认领的 issue，以及 issue 中引用的 [`产品文档`](docs/product/产品设计与开发文档_v1.0.md) 章节（§x）
5. 涉及小程序界面时：[`docs/design/miniapp-ui.md`](docs/design/miniapp-ui.md)

## 1. 选任务

- 只选同时满足以下条件的 issue：
  - 带 `status:ready` 标签（有未完成依赖的是 `status:blocked`，依赖全部关闭后由 CI 自动改为 ready），且**没有** `status:claimed`；
  - 「依赖」一节列出的 issue 全部已关闭；
  - 不带 `type:human`（需要业务方 / 医生 / 法务输入的事项，agent 不认领）。
- 优先选 `wave` 数字小的；同一 wave 内的 issue 互不依赖、独占路径不重叠，可以同时开工。
- `safety-critical` 标签的 issue（红旗、禁忌、风险、授权、加密、越权）要求测试覆盖每一条规则的命中与不命中。

## 2. 认领（防止两个 agent 做同一件事）

所有 agent 可能共用同一个 GitHub 账号，所以用**评论**而不是 assignee 识别认领者：

```bash
gh issue edit <n> --add-label status:claimed --remove-label status:ready
gh issue comment <n> --body "🔒 claim: agent=<你的唯一标识> branch=feat/<n>-<slug> at=<ISO 时间>"
```

- 认领后**重新读取评论**：如果在你之前已有别的 `🔒 claim:` 评论，放弃并另选（先到先得）。
- 认领后 2 小时内推送分支并开 **Draft PR**（正文写 `Closes #<n>`）。
- 24 小时没有新提交或进展评论的认领视为失效，其他 agent 可以评论 `🔓 takeover` 后接手。
- 放弃任务：评论 `🔓 release: <原因>`，恢复 `status:ready`、去掉 `status:claimed`。

## 3. 开发

- 分支：`feat/<issue号>-<英文短名>`，从最新 `main` 切出；一个 issue 一个 PR。
- **只修改 issue「独占路径」里的文件。** 其它文件只读。需要别人的文件发生变化时：
  - 只追加文件（`apps/server/src/modules/index.ts`、`.env.example`、`apps/miniapp/src/pages.json`、`packages/shared/src/core/enums.ts`）可以在末尾追加，PR 里说明；
  - 其它情况：在拥有该文件的 issue 下评论提出需求，或新开 issue（标签 `type:change-request`），**不要直接改**。
- 新增 npm 依赖：只加到自己负责的包，使用精确版本；`pnpm-lock.yaml` 冲突时 rebase 到最新 main 后重新执行 `pnpm install` 生成，**不要手工合并 lock 文件**。
- 契约先行：先写 `packages/shared/src/contracts/<域>.ts`，前后端都依赖契约。
- 改 Prisma schema：严格遵守 [ADR 0003 迁移协议](docs/architecture/adr/0003-数据库与迁移.md)（合并前 rebase，必要时重新生成迁移）。
- 每次提交前：`pnpm lint && pnpm typecheck && pnpm test`。
- 提交信息：`<type>(<scope>): <说明> (#<issue>)`，type ∈ feat / fix / refactor / test / docs / chore / build / ci。

## 4. 完成的定义（DoD）

- [ ] issue 的验收标准逐条满足，并在 PR 描述中逐条勾选说明
- [ ] 单元测试覆盖核心逻辑；新接口有越权测试（见 docs/conventions/api.md）
- [ ] CI 全绿（lint、typecheck、test、build、migrations）
- [ ] 没有修改独占路径以外的文件（只追加文件除外）
- [ ] 前台页面通过乐龄模式检查（§5.4）与禁用词检查（附录 I）
- [ ] 没有把真实客户数据、密钥写进代码、测试、种子或日志
- [ ] PR 合并后关闭 issue（`Closes #n` 自动关闭）；`.github/workflows/unblock.yml` 会自动把依赖已全部关闭的 issue 从 `status:blocked` 改为 `status:ready`

## 5. 不可违背的规则

1. 红旗、风险等级、禁忌、方案骨架只由规则引擎决定；AI 只写文案；L3 / L2 不调用 AI（§1.5、§10.1）。
2. 健康数据：加密存储、C2 授权、权限 + 数据范围、审计日志，缺一不可。
3. 医院端只能看到本院转介单与授权快照；顾问默认只看本人客户；员工看不到魔镜聊天原文。
4. 前台不出现"高端 / 中端 / 低端""老人 / 老年版"，不按用户画像差别定价，魔镜不推销。
5. 规则、阈值、题库、授权文本标注【医生确认】【法务确认】的，代码里按文档初稿实现并保留"待确认"标记，**不得自行修改阈值**。
6. 不确定时，在 issue 里提问并暂停该部分，不要猜。

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
