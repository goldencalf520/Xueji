<!-- 标题格式：<type>(<scope>): <说明> (#issue)，例如 feat(consent): 授权中心记录与撤回 (#12) -->

## 关联 issue

Closes #

## 做了什么

-

## 自查清单

- [ ] 只修改了 issue「独占路径」内的文件；越界修改已在下方说明并 @ 相关 issue
- [ ] `pnpm lint && pnpm typecheck && pnpm test` 本地通过
- [ ] 改了 `prisma/schema/*.prisma` 时：已 rebase 最新 main 并重新生成迁移（只含本 PR 的变更）
- [ ] 新接口的请求 / 响应契约写在 `packages/shared/src/contracts/<域>.ts`
- [ ] 涉及健康数据的接口已加 `@Audit`、数据范围与权限码
- [ ] 前台文案通过禁用词检查（附录 I），乐龄模式已适配（§5.4）
- [ ] 安全相关（红旗 / 禁忌 / 风险 / 授权）已附测试用例，且未把判断交给 AI

## 越界修改说明（没有则删除）

