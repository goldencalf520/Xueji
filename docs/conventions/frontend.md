# 前端约定

## 管理端 / 医院端 / 移动工作台（apps/admin）

- 一个功能一个目录：`src/modules/<功能>/`，包含页面组件、`api.ts`（调用接口，类型来自 `@xueji/shared/contracts/<域>`）、
  以及按端划分的路由文件 `admin.routes.ts` / `hospital.routes.ts` / `mobile.routes.ts`（默认导出 `FeatureRoute[]`）。
- 路由由入口自动收集，**不要修改 `src/entries/*/router.ts`**。管理端菜单分组见 `src/entries/admin/menu-groups.ts`（§6.1），路由 `meta.group` 指定所属分组。
- 权限：路由 `meta.permission` 与按钮级 `v-perm` 指令（由管理端框架 issue 提供）使用 §2.2 的权限码。
- `src/shared/` 由框架 issue 维护；业务 issue 需要新的通用组件时在 `src/shared/components/` **新增文件**，不修改已有文件。
- 客户详情页的标签页通过 `src/modules/<功能>/customer-tabs.ts` 注册（由客户详情 issue 建立机制），各业务 issue 自己注册自己的标签页。
- 页面必须显示水印（员工姓名 + 工号）；健康数据只在健康顾问权限下展示。
- 移动工作台：单列、大按钮、常用操作两步内完成（§6.3）；扫码等能力通过企微 JS-SDK 封装调用。

## 小程序（apps/miniapp）

- 43 个页面已在 `pages.json` 注册并有占位页，**实现时只替换对应 `.vue` 文件**。
- 页面目录即分包：`pages/`（主包，只放 4 个标签页）、`pkg-<域>/`（分包）。主包 < 2 MB、总包 < 20 MB（§16）。
- 接口：每个域一个 `src/api/<域>.ts`，用 `src/api/request.ts`；**不用 PATCH**（见 docs/conventions/api.md）。
- 状态：每个域一个 `src/stores/<域>.ts`（Pinia 2）。
- 组件：基础组件 `src/components/base/`（由小程序基础 issue 提供）；首页配置驱动组件 `src/components/home/`；题型组件 `src/components/quiz/`。
  第三方组件用 wot-design-uni（`wd-` 前缀，easycom 自动引入）。
- 样式：只用 `src/styles/tokens.scss` 中的令牌（`uni.scss` 已全局注入），尺寸用 rpx（750 设计稿）。
- **乐龄模式（§5.4）是每个页面的验收项**：正文 36rpx、标题 48rpx、按钮高 104rpx、间距 32rpx、一页一事、不依赖滑动、图标必带文字、按钮写明动作。
- 文案：称呼用"您"和客户设定的称呼；不出现"老人 / 老年版"；不出现禁用词（附录 I）；乐龄模式每句不超过 25 字。
- 隐私：不在本地缓存健康数据明文；退出登录清除缓存；分享海报不含任何健康数据。
- 埋点：使用基础 issue 提供的 `track(event, props)`，事件名见 §15.2。
