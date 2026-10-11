# 目录归属与 issue 对照

> 由架构初始化时根据 issue 规格生成；之后新增 issue 时请按相同格式在对应表格追加一行。规则见 [ADR 0002](adr/0002-并行开发与代码所有权.md) 与 [AGENTS.md](../../AGENTS.md)。
> 同一路径出现多个 issue 时，它们之间有依赖关系、按顺序串行修改（第一个为创建者）。

## 史诗

| 史诗 | issue | 版本 | 子任务数 |
|---|---|---|---|
| E0 工程基础与横切能力 | [#5](https://github.com/goldencalf520/Xueji/issues/5) | V1.0 | 18 |
| E1 账号、客户与授权中心 | [#6](https://github.com/goldencalf520/Xueji/issues/6) | V1.0 | 20 |
| E2 会员分级 | [#7](https://github.com/goldencalf520/Xueji/issues/7) | V1.0 | 3 |
| E3 模块配置与首页 | [#8](https://github.com/goldencalf520/Xueji/issues/8) | V1.0 | 6 |
| E4 文旅线索、合作方、家人与活动 | [#9](https://github.com/goldencalf520/Xueji/issues/9) | V1.0 | 11 |
| E5 AI 网关与魔镜 | [#10](https://github.com/goldencalf520/Xueji/issues/10) | V1.0 | 13 |
| E6 顾问移动工作台与后台工作台 | [#11](https://github.com/goldencalf520/Xueji/issues/11) | V1.0 | 8 |
| E7 六维测评与规则引擎 | [#12](https://github.com/goldencalf520/Xueji/issues/12) | V1.1 | 19 |
| E8 健康档案、设备准入与报告 | [#13](https://github.com/goldencalf520/Xueji/issues/13) | V1.1 | 10 |
| E9 体检券、转介与医院端 | [#14](https://github.com/goldencalf520/Xueji/issues/14) | V1.1 | 14 |
| E10 养护方案与 AI 文案 | [#15](https://github.com/goldencalf520/Xueji/issues/15) | V1.1 | 7 |
| E11 运营玩法 | [#16](https://github.com/goldencalf520/Xueji/issues/16) | V1.2 | 13 |
| E12 数据埋点与看板 | [#17](https://github.com/goldencalf520/Xueji/issues/17) | V1.2 | 3 |
| E13 质量、安全与上线 | [#18](https://github.com/goldencalf520/Xueji/issues/18) | V1.1 | 4 |
| EH 业务输入与外部确认（需人工） | [#19](https://github.com/goldencalf520/Xueji/issues/19) | V1.0 | 8 |

## 按路径查负责 issue

| 路径 | 负责 issue |
|---|---|
| `.github/workflows/audit.yml` | [#34](https://github.com/goldencalf520/Xueji/issues/34) `INF-01` |
| `.github/workflows/ci.yml` | [#165](https://github.com/goldencalf520/Xueji/issues/165) `QA-01` |
| `.github/workflows/deploy-*.yml` | [#34](https://github.com/goldencalf520/Xueji/issues/34) `INF-01` |
| `apps/admin/package.json` | [#46](https://github.com/goldencalf520/Xueji/issues/46) `ADM-01` |
| `apps/admin/src/entries/admin/**` | [#46](https://github.com/goldencalf520/Xueji/issues/46) `ADM-01` |
| `apps/admin/src/entries/hospital/**` | [#54](https://github.com/goldencalf520/Xueji/issues/54) `ADM-03` |
| `apps/admin/src/entries/mobile/**` | [#55](https://github.com/goldencalf520/Xueji/issues/55) `ADM-04` |
| `apps/admin/src/mobile-shared/**` | [#55](https://github.com/goldencalf520/Xueji/issues/55) `ADM-04` |
| `apps/admin/src/modules/activity/**` | [#95](https://github.com/goldencalf520/Xueji/issues/95) `ACT-02` |
| `apps/admin/src/modules/admin-auth/**` | [#47](https://github.com/goldencalf520/Xueji/issues/47) `ADM-02` |
| `apps/admin/src/modules/alert/**` | [#101](https://github.com/goldencalf520/Xueji/issues/101) `ALERT-02` |
| `apps/admin/src/modules/assessment-bank/**` | [#119](https://github.com/goldencalf520/Xueji/issues/119) `ASM-03` |
| `apps/admin/src/modules/assessment-records/**` | [#120](https://github.com/goldencalf520/Xueji/issues/120) `ASM-04` |
| `apps/admin/src/modules/checkup/**` | [#139](https://github.com/goldencalf520/Xueji/issues/139) `CHK-03` |
| `apps/admin/src/modules/consent-texts/**` | [#48](https://github.com/goldencalf520/Xueji/issues/48) `CNS-02` |
| `apps/admin/src/modules/consumption-import/**` | [#66](https://github.com/goldencalf520/Xueji/issues/66) `TIER-03` |
| `apps/admin/src/modules/customer/**` | [#52](https://github.com/goldencalf520/Xueji/issues/52) `CUS-03` |
| `apps/admin/src/modules/device/**` | [#128](https://github.com/goldencalf520/Xueji/issues/128) `DEV-03` |
| `apps/admin/src/modules/engine-config/**` | [#118](https://github.com/goldencalf520/Xueji/issues/118) `ENG-03` |
| `apps/admin/src/modules/groupbuy/**` | [#159](https://github.com/goldencalf520/Xueji/issues/159) `MKT-2` |
| `apps/admin/src/modules/home-layout/**` | [#72](https://github.com/goldencalf520/Xueji/issues/72) `HOME-02` → [#163](https://github.com/goldencalf520/Xueji/issues/163) `HOME-03` |
| `apps/admin/src/modules/hospital-account/**` | [#138](https://github.com/goldencalf520/Xueji/issues/138) `HOSP-05` |
| `apps/admin/src/modules/hospital-auth/**` | [#54](https://github.com/goldencalf520/Xueji/issues/54) `ADM-03` |
| `apps/admin/src/modules/hospital-calendar/**` | [#138](https://github.com/goldencalf520/Xueji/issues/138) `HOSP-05` |
| `apps/admin/src/modules/hospital-home/**` | [#54](https://github.com/goldencalf520/Xueji/issues/54) `ADM-03` |
| `apps/admin/src/modules/hospital-referral/**` | [#137](https://github.com/goldencalf520/Xueji/issues/137) `HOSP-04` |
| `apps/admin/src/modules/hospital-services/**` | [#138](https://github.com/goldencalf520/Xueji/issues/138) `HOSP-05` |
| `apps/admin/src/modules/hospital-statement/**` | [#138](https://github.com/goldencalf520/Xueji/issues/138) `HOSP-05` |
| `apps/admin/src/modules/lead/**` | [#76](https://github.com/goldencalf520/Xueji/issues/76) `LEAD-02` |
| `apps/admin/src/modules/measurement-import/**` | [#129](https://github.com/goldencalf520/Xueji/issues/129) `DEV-04` |
| `apps/admin/src/modules/mirror-sample/**` | [#107](https://github.com/goldencalf520/Xueji/issues/107) `MIR-07` |
| `apps/admin/src/modules/mirror/**` | [#102](https://github.com/goldencalf520/Xueji/issues/102) `MIR-06` |
| `apps/admin/src/modules/mobile-alert/**` | [#110](https://github.com/goldencalf520/Xueji/issues/110) `MOB-05` |
| `apps/admin/src/modules/mobile-assist/**` | [#114](https://github.com/goldencalf520/Xueji/issues/114) `MOB-04` |
| `apps/admin/src/modules/mobile-customer/**` | [#109](https://github.com/goldencalf520/Xueji/issues/109) `MOB-01` |
| `apps/admin/src/modules/mobile-home/**` | [#55](https://github.com/goldencalf520/Xueji/issues/55) `ADM-04` |
| `apps/admin/src/modules/mobile-lead/**` | [#78](https://github.com/goldencalf520/Xueji/issues/78) `MOB-02` |
| `apps/admin/src/modules/mobile-plan/**` | [#115](https://github.com/goldencalf520/Xueji/issues/115) `MOB-06` |
| `apps/admin/src/modules/mobile-scan/**` | [#112](https://github.com/goldencalf520/Xueji/issues/112) `MOB-03` |
| `apps/admin/src/modules/mobile-service-check/**` | [#114](https://github.com/goldencalf520/Xueji/issues/114) `MOB-04` |
| `apps/admin/src/modules/mobile-tasks/**` | [#109](https://github.com/goldencalf520/Xueji/issues/109) `MOB-01` |
| `apps/admin/src/modules/module-center/**` | [#71](https://github.com/goldencalf520/Xueji/issues/71) `MOD-02` |
| `apps/admin/src/modules/partner/**` | [#74](https://github.com/goldencalf520/Xueji/issues/74) `PTN-02` |
| `apps/admin/src/modules/plan/**` | [#143](https://github.com/goldencalf520/Xueji/issues/143) `PLAN-02` |
| `apps/admin/src/modules/points/**` | [#158](https://github.com/goldencalf520/Xueji/issues/158) `MKT-1` |
| `apps/admin/src/modules/qrcode/**` | [#53](https://github.com/goldencalf520/Xueji/issues/53) `QR-01` |
| `apps/admin/src/modules/quiz/**` | [#158](https://github.com/goldencalf520/Xueji/issues/158) `MKT-1` |
| `apps/admin/src/modules/referral/**` | [#140](https://github.com/goldencalf520/Xueji/issues/140) `REF-03` |
| `apps/admin/src/modules/report-review/**` | [#130](https://github.com/goldencalf520/Xueji/issues/130) `RPT-02` |
| `apps/admin/src/modules/statement/**` | [#141](https://github.com/goldencalf520/Xueji/issues/141) `STMT-ADM` |
| `apps/admin/src/modules/stats/**` | [#164](https://github.com/goldencalf520/Xueji/issues/164) `STAT-03` |
| `apps/admin/src/modules/tier/**` | [#66](https://github.com/goldencalf520/Xueji/issues/66) `TIER-03` |
| `apps/admin/src/modules/workbench/**` | [#111](https://github.com/goldencalf520/Xueji/issues/111) `ADM-WB` |
| `apps/admin/src/shared/**` | [#46](https://github.com/goldencalf520/Xueji/issues/46) `ADM-01` |
| `apps/admin/src/shared/auth/**` | [#47](https://github.com/goldencalf520/Xueji/issues/47) `ADM-02` |
| `apps/admin/vite.config.ts` | [#46](https://github.com/goldencalf520/Xueji/issues/46) `ADM-01` |
| `apps/miniapp/src/api/activity.ts` | [#96](https://github.com/goldencalf520/Xueji/issues/96) `ACT-03` |
| `apps/miniapp/src/api/archive.ts` | [#131](https://github.com/goldencalf520/Xueji/issues/131) `MP-ARC-1` |
| `apps/miniapp/src/api/assessment.ts` | [#121](https://github.com/goldencalf520/Xueji/issues/121) `MP-ASM-1` |
| `apps/miniapp/src/api/auth.ts` | [#60](https://github.com/goldencalf520/Xueji/issues/60) `MP-AUTH` |
| `apps/miniapp/src/api/checkin.ts` | [#154](https://github.com/goldencalf520/Xueji/issues/154) `MP-PTS` |
| `apps/miniapp/src/api/checkup.ts` | [#142](https://github.com/goldencalf520/Xueji/issues/142) `MP-CHK` |
| `apps/miniapp/src/api/consent.ts` | [#60](https://github.com/goldencalf520/Xueji/issues/60) `MP-AUTH` |
| `apps/miniapp/src/api/family.ts` | [#80](https://github.com/goldencalf520/Xueji/issues/80) `MP-FAM` |
| `apps/miniapp/src/api/groupbuy.ts` | [#156](https://github.com/goldencalf520/Xueji/issues/156) `MP-GB` |
| `apps/miniapp/src/api/home.ts` | [#73](https://github.com/goldencalf520/Xueji/issues/73) `MP-HOME` |
| `apps/miniapp/src/api/hospital-report.ts` | [#133](https://github.com/goldencalf520/Xueji/issues/133) `MP-ARC-3` |
| `apps/miniapp/src/api/lead.ts` | [#77](https://github.com/goldencalf520/Xueji/issues/77) `MP-MOD` |
| `apps/miniapp/src/api/mirror-memory.ts` | [#105](https://github.com/goldencalf520/Xueji/issues/105) `MIR-04` |
| `apps/miniapp/src/api/mirror.ts` | [#100](https://github.com/goldencalf520/Xueji/issues/100) `MP-MIR` |
| `apps/miniapp/src/api/module.ts` | [#77](https://github.com/goldencalf520/Xueji/issues/77) `MP-MOD` |
| `apps/miniapp/src/api/notify.ts` | [#65](https://github.com/goldencalf520/Xueji/issues/65) `MP-MSG` |
| `apps/miniapp/src/api/photo.ts` | [#176](https://github.com/goldencalf520/Xueji/issues/176) `PHOTO-01` |
| `apps/miniapp/src/api/plan.ts` | [#144](https://github.com/goldencalf520/Xueji/issues/144) `MP-PLAN` |
| `apps/miniapp/src/api/points.ts` | [#154](https://github.com/goldencalf520/Xueji/issues/154) `MP-PTS` |
| `apps/miniapp/src/api/privacy.ts` | [#64](https://github.com/goldencalf520/Xueji/issues/64) `MP-ME-2` |
| `apps/miniapp/src/api/profile.ts` | [#63](https://github.com/goldencalf520/Xueji/issues/63) `MP-ME-1` |
| `apps/miniapp/src/api/quiz.ts` | [#155](https://github.com/goldencalf520/Xueji/issues/155) `MP-GAME` |
| `apps/miniapp/src/api/report.ts` | [#132](https://github.com/goldencalf520/Xueji/issues/132) `MP-ARC-2` |
| `apps/miniapp/src/api/request.ts` | [#56](https://github.com/goldencalf520/Xueji/issues/56) `MP-01` |
| `apps/miniapp/src/api/speech.ts` | [#59](https://github.com/goldencalf520/Xueji/issues/59) `MP-03` |
| `apps/miniapp/src/api/tier.ts` | [#63](https://github.com/goldencalf520/Xueji/issues/63) `MP-ME-1` |
| `apps/miniapp/src/api/transport.ts` | [#157](https://github.com/goldencalf520/Xueji/issues/157) `MP-TRN` |
| `apps/miniapp/src/App.vue` | [#56](https://github.com/goldencalf520/Xueji/issues/56) `MP-01` |
| `apps/miniapp/src/components/base/**` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `apps/miniapp/src/components/charts/**` | [#124](https://github.com/goldencalf520/Xueji/issues/124) `MP-ASM-4` |
| `apps/miniapp/src/components/form-renderer/**` | [#77](https://github.com/goldencalf520/Xueji/issues/77) `MP-MOD` |
| `apps/miniapp/src/components/home/**` | [#73](https://github.com/goldencalf520/Xueji/issues/73) `MP-HOME` |
| `apps/miniapp/src/components/mirror/**` | [#100](https://github.com/goldencalf520/Xueji/issues/100) `MP-MIR` |
| `apps/miniapp/src/components/quiz/**` | [#122](https://github.com/goldencalf520/Xueji/issues/122) `MP-ASM-2` |
| `apps/miniapp/src/composables/subscribe.ts` | [#65](https://github.com/goldencalf520/Xueji/issues/65) `MP-MSG` |
| `apps/miniapp/src/composables/voice/**` | [#59](https://github.com/goldencalf520/Xueji/issues/59) `MP-03` |
| `apps/miniapp/src/custom-tab-bar/**` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `apps/miniapp/src/elder/**` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `apps/miniapp/src/pages.json` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `apps/miniapp/src/pages/archive/**` | [#131](https://github.com/goldencalf520/Xueji/issues/131) `MP-ARC-1` |
| `apps/miniapp/src/pages/index/**` | [#73](https://github.com/goldencalf520/Xueji/issues/73) `MP-HOME` |
| `apps/miniapp/src/pages/me/**` | [#63](https://github.com/goldencalf520/Xueji/issues/63) `MP-ME-1` |
| `apps/miniapp/src/pages/mirror/**` | [#100](https://github.com/goldencalf520/Xueji/issues/100) `MP-MIR` |
| `apps/miniapp/src/pkg-archive/hospital.vue` | [#133](https://github.com/goldencalf520/Xueji/issues/133) `MP-ARC-3` |
| `apps/miniapp/src/pkg-archive/photos.vue` | [#176](https://github.com/goldencalf520/Xueji/issues/176) `PHOTO-01` |
| `apps/miniapp/src/pkg-archive/report.vue` | [#132](https://github.com/goldencalf520/Xueji/issues/132) `MP-ARC-2` |
| `apps/miniapp/src/pkg-archive/timeline.vue` | [#131](https://github.com/goldencalf520/Xueji/issues/131) `MP-ARC-1` |
| `apps/miniapp/src/pkg-archive/trend.vue` | [#132](https://github.com/goldencalf520/Xueji/issues/132) `MP-ARC-2` |
| `apps/miniapp/src/pkg-assess/intro.vue` | [#121](https://github.com/goldencalf520/Xueji/issues/121) `MP-ASM-1` |
| `apps/miniapp/src/pkg-assess/map.vue` | [#121](https://github.com/goldencalf520/Xueji/issues/121) `MP-ASM-1` |
| `apps/miniapp/src/pkg-assess/question.vue` | [#122](https://github.com/goldencalf520/Xueji/issues/122) `MP-ASM-2` |
| `apps/miniapp/src/pkg-assess/result.vue` | [#124](https://github.com/goldencalf520/Xueji/issues/124) `MP-ASM-4` |
| `apps/miniapp/src/pkg-assess/test-balance.vue` | [#123](https://github.com/goldencalf520/Xueji/issues/123) `MP-ASM-3` |
| `apps/miniapp/src/pkg-assess/test-chair.vue` | [#123](https://github.com/goldencalf520/Xueji/issues/123) `MP-ASM-3` |
| `apps/miniapp/src/pkg-assess/urgent.vue` | [#123](https://github.com/goldencalf520/Xueji/issues/123) `MP-ASM-3` |
| `apps/miniapp/src/pkg-auth/**` | [#60](https://github.com/goldencalf520/Xueji/issues/60) `MP-AUTH` |
| `apps/miniapp/src/pkg-checkup/**` | [#142](https://github.com/goldencalf520/Xueji/issues/142) `MP-CHK` |
| `apps/miniapp/src/pkg-family/accept.vue` | [#80](https://github.com/goldencalf520/Xueji/issues/80) `MP-FAM` |
| `apps/miniapp/src/pkg-family/invite.vue` | [#80](https://github.com/goldencalf520/Xueji/issues/80) `MP-FAM` |
| `apps/miniapp/src/pkg-family/list.vue` | [#80](https://github.com/goldencalf520/Xueji/issues/80) `MP-FAM` |
| `apps/miniapp/src/pkg-family/view.vue` | [#93](https://github.com/goldencalf520/Xueji/issues/93) `FAM-02` |
| `apps/miniapp/src/pkg-game/**` | [#155](https://github.com/goldencalf520/Xueji/issues/155) `MP-GAME` |
| `apps/miniapp/src/pkg-group/**` | [#156](https://github.com/goldencalf520/Xueji/issues/156) `MP-GB` |
| `apps/miniapp/src/pkg-me/about.vue` | [#63](https://github.com/goldencalf520/Xueji/issues/63) `MP-ME-1` |
| `apps/miniapp/src/pkg-me/consents.vue` | [#64](https://github.com/goldencalf520/Xueji/issues/64) `MP-ME-2` |
| `apps/miniapp/src/pkg-me/memories.vue` | [#105](https://github.com/goldencalf520/Xueji/issues/105) `MIR-04` |
| `apps/miniapp/src/pkg-me/messages.vue` | [#65](https://github.com/goldencalf520/Xueji/issues/65) `MP-MSG` |
| `apps/miniapp/src/pkg-me/privacy.vue` | [#64](https://github.com/goldencalf520/Xueji/issues/64) `MP-ME-2` |
| `apps/miniapp/src/pkg-me/settings.vue` | [#63](https://github.com/goldencalf520/Xueji/issues/63) `MP-ME-1` |
| `apps/miniapp/src/pkg-me/tier.vue` | [#63](https://github.com/goldencalf520/Xueji/issues/63) `MP-ME-1` |
| `apps/miniapp/src/pkg-module/activity.vue` | [#96](https://github.com/goldencalf520/Xueji/issues/96) `ACT-03` |
| `apps/miniapp/src/pkg-module/detail.vue` | [#77](https://github.com/goldencalf520/Xueji/issues/77) `MP-MOD` |
| `apps/miniapp/src/pkg-module/lead-form.vue` | [#77](https://github.com/goldencalf520/Xueji/issues/77) `MP-MOD` |
| `apps/miniapp/src/pkg-module/transport.vue` | [#157](https://github.com/goldencalf520/Xueji/issues/157) `MP-TRN` |
| `apps/miniapp/src/pkg-module/vip.vue` | [#77](https://github.com/goldencalf520/Xueji/issues/77) `MP-MOD` |
| `apps/miniapp/src/pkg-plan/**` | [#144](https://github.com/goldencalf520/Xueji/issues/144) `MP-PLAN` |
| `apps/miniapp/src/pkg-points/**` | [#154](https://github.com/goldencalf520/Xueji/issues/154) `MP-PTS` |
| `apps/miniapp/src/stores/assessment.ts` | [#121](https://github.com/goldencalf520/Xueji/issues/121) `MP-ASM-1` |
| `apps/miniapp/src/stores/session.ts` | [#56](https://github.com/goldencalf520/Xueji/issues/56) `MP-01` |
| `apps/miniapp/src/stores/ui.ts` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `apps/miniapp/src/styles/**` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `apps/miniapp/src/uni.scss` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `apps/miniapp/src/utils/**` | [#56](https://github.com/goldencalf520/Xueji/issues/56) `MP-01` |
| `apps/miniapp/test/e2e/**` | [#166](https://github.com/goldencalf520/Xueji/issues/166) `QA-02` |
| `apps/server/prisma/schema/activity.prisma` | [#94](https://github.com/goldencalf520/Xueji/issues/94) `ACT-01` |
| `apps/server/prisma/schema/ai.prisma` | [#98](https://github.com/goldencalf520/Xueji/issues/98) `AI-02` |
| `apps/server/prisma/schema/alert.prisma` | [#87](https://github.com/goldencalf520/Xueji/issues/87) `ALERT-01` |
| `apps/server/prisma/schema/archive.prisma` | [#81](https://github.com/goldencalf520/Xueji/issues/81) `ARC-01` |
| `apps/server/prisma/schema/assessment.prisma` | [#86](https://github.com/goldencalf520/Xueji/issues/86) `ASM-01` |
| `apps/server/prisma/schema/audit.prisma` | [#25](https://github.com/goldencalf520/Xueji/issues/25) `SRV-06` |
| `apps/server/prisma/schema/auth-admin.prisma` | [#43](https://github.com/goldencalf520/Xueji/issues/43) `AUTH-02` |
| `apps/server/prisma/schema/checkin.prisma` | [#150](https://github.com/goldencalf520/Xueji/issues/150) `CHKIN-01` |
| `apps/server/prisma/schema/checkup.prisma` | [#88](https://github.com/goldencalf520/Xueji/issues/88) `CHK-01` |
| `apps/server/prisma/schema/consent.prisma` | [#41](https://github.com/goldencalf520/Xueji/issues/41) `CNS-01` |
| `apps/server/prisma/schema/consumption.prisma` | [#61](https://github.com/goldencalf520/Xueji/issues/61) `TIER-01` |
| `apps/server/prisma/schema/customer-admin.prisma` | [#50](https://github.com/goldencalf520/Xueji/issues/50) `CUS-02` |
| `apps/server/prisma/schema/customer.prisma` | [#36](https://github.com/goldencalf520/Xueji/issues/36) `CUS-01` |
| `apps/server/prisma/schema/device.prisma` | [#125](https://github.com/goldencalf520/Xueji/issues/125) `DEV-01` |
| `apps/server/prisma/schema/engine.prisma` | [#85](https://github.com/goldencalf520/Xueji/issues/85) `ENG-01` |
| `apps/server/prisma/schema/family.prisma` | [#79](https://github.com/goldencalf520/Xueji/issues/79) `FAM-01` |
| `apps/server/prisma/schema/file.prisma` | [#26](https://github.com/goldencalf520/Xueji/issues/26) `SRV-07` |
| `apps/server/prisma/schema/groupbuy.prisma` | [#152](https://github.com/goldencalf520/Xueji/issues/152) `GB-01` |
| `apps/server/prisma/schema/home.prisma` | [#69](https://github.com/goldencalf520/Xueji/issues/69) `HOME-01` |
| `apps/server/prisma/schema/hospital-catalog.prisma` | [#135](https://github.com/goldencalf520/Xueji/issues/135) `HOSP-02` |
| `apps/server/prisma/schema/lead.prisma` | [#75](https://github.com/goldencalf520/Xueji/issues/75) `LEAD-01` |
| `apps/server/prisma/schema/measurement.prisma` | [#127](https://github.com/goldencalf520/Xueji/issues/127) `DEV-02` |
| `apps/server/prisma/schema/mirror.prisma` | [#99](https://github.com/goldencalf520/Xueji/issues/99) `MIR-01` |
| `apps/server/prisma/schema/module.prisma` | [#68](https://github.com/goldencalf520/Xueji/issues/68) `MOD-01` |
| `apps/server/prisma/schema/notify.prisma` | [#31](https://github.com/goldencalf520/Xueji/issues/31) `SRV-12` |
| `apps/server/prisma/schema/org.prisma` | [#23](https://github.com/goldencalf520/Xueji/issues/23) `SRV-04` |
| `apps/server/prisma/schema/partner.prisma` | [#44](https://github.com/goldencalf520/Xueji/issues/44) `PTN-01` |
| `apps/server/prisma/schema/photo.prisma` | [#176](https://github.com/goldencalf520/Xueji/issues/176) `PHOTO-01` |
| `apps/server/prisma/schema/plan.prisma` | [#91](https://github.com/goldencalf520/Xueji/issues/91) `PLAN-01` |
| `apps/server/prisma/schema/points.prisma` | [#149](https://github.com/goldencalf520/Xueji/issues/149) `PTS-01` |
| `apps/server/prisma/schema/privacy.prisma` | [#49](https://github.com/goldencalf520/Xueji/issues/49) `PRV-01` |
| `apps/server/prisma/schema/quiz.prisma` | [#151](https://github.com/goldencalf520/Xueji/issues/151) `QUIZ-01` |
| `apps/server/prisma/schema/referral.prisma` | [#90](https://github.com/goldencalf520/Xueji/issues/90) `REF-01` |
| `apps/server/prisma/schema/report.prisma` | [#126](https://github.com/goldencalf520/Xueji/issues/126) `RPT-01` |
| `apps/server/prisma/schema/service-check.prisma` | [#113](https://github.com/goldencalf520/Xueji/issues/113) `SVC-01` |
| `apps/server/prisma/schema/settings.prisma` | [#28](https://github.com/goldencalf520/Xueji/issues/28) `SRV-09` |
| `apps/server/prisma/schema/statement.prisma` | [#136](https://github.com/goldencalf520/Xueji/issues/136) `HOSP-03` |
| `apps/server/prisma/schema/stats.prisma` | [#161](https://github.com/goldencalf520/Xueji/issues/161) `STAT-01` |
| `apps/server/prisma/schema/task.prisma` | [#32](https://github.com/goldencalf520/Xueji/issues/32) `SRV-13` |
| `apps/server/prisma/schema/tier.prisma` | [#62](https://github.com/goldencalf520/Xueji/issues/62) `TIER-02` |
| `apps/server/prisma/schema/transport.prisma` | [#153](https://github.com/goldencalf520/Xueji/issues/153) `TRN-01` |
| `apps/server/prisma/seed/10-org.seed.ts` | [#23](https://github.com/goldencalf520/Xueji/issues/23) `SRV-04` |
| `apps/server/prisma/seed/20-settings.seed.ts` | [#28](https://github.com/goldencalf520/Xueji/issues/28) `SRV-09` |
| `apps/server/prisma/seed/30-consent.seed.ts` | [#41](https://github.com/goldencalf520/Xueji/issues/41) `CNS-01` |
| `apps/server/prisma/seed/40-module-home.seed.ts` | [#70](https://github.com/goldencalf520/Xueji/issues/70) `SEED-01` |
| `apps/server/prisma/seed/50-engine.seed.ts` | [#85](https://github.com/goldencalf520/Xueji/issues/85) `ENG-01` |
| `apps/server/prisma/seed/60-assessment.seed.ts` | [#86](https://github.com/goldencalf520/Xueji/issues/86) `ASM-01` |
| `apps/server/prisma/seed/70-checkup.seed.ts` | [#88](https://github.com/goldencalf520/Xueji/issues/88) `CHK-01` |
| `apps/server/src/common/audit/**` | [#25](https://github.com/goldencalf520/Xueji/issues/25) `SRV-06` |
| `apps/server/src/common/auth/**` | [#22](https://github.com/goldencalf520/Xueji/issues/22) `SRV-03` |
| `apps/server/src/common/crypto/**` | [#21](https://github.com/goldencalf520/Xueji/issues/21) `SRV-02` |
| `apps/server/src/common/http-extras/**` | [#20](https://github.com/goldencalf520/Xueji/issues/20) `SRV-01` |
| `apps/server/src/common/logger/**` | [#21](https://github.com/goldencalf520/Xueji/issues/21) `SRV-02` |
| `apps/server/src/common/observability/**` | [#35](https://github.com/goldencalf520/Xueji/issues/35) `INF-02` |
| `apps/server/src/common/prisma/**` | [#21](https://github.com/goldencalf520/Xueji/issues/21) `SRV-02` |
| `apps/server/src/common/queue/**` | [#27](https://github.com/goldencalf520/Xueji/issues/27) `SRV-08` |
| `apps/server/src/common/rbac/**` | [#24](https://github.com/goldencalf520/Xueji/issues/24) `SRV-05` |
| `apps/server/src/modules/activity/**` | [#94](https://github.com/goldencalf520/Xueji/issues/94) `ACT-01` |
| `apps/server/src/modules/ai/**` | [#98](https://github.com/goldencalf520/Xueji/issues/98) `AI-02` |
| `apps/server/src/modules/alert/**` | [#87](https://github.com/goldencalf520/Xueji/issues/87) `ALERT-01` |
| `apps/server/src/modules/annual-report/**` | [#160](https://github.com/goldencalf520/Xueji/issues/160) `ANNUAL-01` |
| `apps/server/src/modules/app-profile/**` | [#42](https://github.com/goldencalf520/Xueji/issues/42) `APP-01` |
| `apps/server/src/modules/archive/**` | [#81](https://github.com/goldencalf520/Xueji/issues/81) `ARC-01` |
| `apps/server/src/modules/assessment-bank/**` | [#86](https://github.com/goldencalf520/Xueji/issues/86) `ASM-01` |
| `apps/server/src/modules/assessment/**` | [#89](https://github.com/goldencalf520/Xueji/issues/89) `ASM-02` |
| `apps/server/src/modules/audit/**` | [#25](https://github.com/goldencalf520/Xueji/issues/25) `SRV-06` |
| `apps/server/src/modules/auth-admin/**` | [#43](https://github.com/goldencalf520/Xueji/issues/43) `AUTH-02` |
| `apps/server/src/modules/auth-app/**` | [#40](https://github.com/goldencalf520/Xueji/issues/40) `AUTH-01` |
| `apps/server/src/modules/auth-hospital/**` | [#45](https://github.com/goldencalf520/Xueji/issues/45) `AUTH-03` |
| `apps/server/src/modules/checkin/**` | [#150](https://github.com/goldencalf520/Xueji/issues/150) `CHKIN-01` |
| `apps/server/src/modules/checkup-booking/**` | [#134](https://github.com/goldencalf520/Xueji/issues/134) `CHK-02` |
| `apps/server/src/modules/checkup/**` | [#88](https://github.com/goldencalf520/Xueji/issues/88) `CHK-01` |
| `apps/server/src/modules/consent/**` | [#41](https://github.com/goldencalf520/Xueji/issues/41) `CNS-01` |
| `apps/server/src/modules/consumption/**` | [#61](https://github.com/goldencalf520/Xueji/issues/61) `TIER-01` |
| `apps/server/src/modules/customer-admin/**` | [#50](https://github.com/goldencalf520/Xueji/issues/50) `CUS-02` |
| `apps/server/src/modules/customer/**` | [#36](https://github.com/goldencalf520/Xueji/issues/36) `CUS-01` |
| `apps/server/src/modules/dashboard/**` | [#111](https://github.com/goldencalf520/Xueji/issues/111) `ADM-WB` |
| `apps/server/src/modules/device/**` | [#125](https://github.com/goldencalf520/Xueji/issues/125) `DEV-01` |
| `apps/server/src/modules/engine-config/**` | [#117](https://github.com/goldencalf520/Xueji/issues/117) `ENG-02` |
| `apps/server/src/modules/engine/**` | [#85](https://github.com/goldencalf520/Xueji/issues/85) `ENG-01` |
| `apps/server/src/modules/family/**` | [#79](https://github.com/goldencalf520/Xueji/issues/79) `FAM-01` → [#93](https://github.com/goldencalf520/Xueji/issues/93) `FAM-02` |
| `apps/server/src/modules/file/**` | [#26](https://github.com/goldencalf520/Xueji/issues/26) `SRV-07` |
| `apps/server/src/modules/groupbuy/**` | [#152](https://github.com/goldencalf520/Xueji/issues/152) `GB-01` |
| `apps/server/src/modules/home/**` | [#69](https://github.com/goldencalf520/Xueji/issues/69) `HOME-01` → [#163](https://github.com/goldencalf520/Xueji/issues/163) `HOME-03` |
| `apps/server/src/modules/hospital-catalog/**` | [#135](https://github.com/goldencalf520/Xueji/issues/135) `HOSP-02` |
| `apps/server/src/modules/hospital-referral/**` | [#92](https://github.com/goldencalf520/Xueji/issues/92) `HOSP-01` |
| `apps/server/src/modules/lead/**` | [#75](https://github.com/goldencalf520/Xueji/issues/75) `LEAD-01` |
| `apps/server/src/modules/measurement/**` | [#127](https://github.com/goldencalf520/Xueji/issues/127) `DEV-02` |
| `apps/server/src/modules/mirror/**` | [#99](https://github.com/goldencalf520/Xueji/issues/99) `MIR-01` → [#103](https://github.com/goldencalf520/Xueji/issues/103) `MIR-02` → [#104](https://github.com/goldencalf520/Xueji/issues/104) `MIR-03` → [#106](https://github.com/goldencalf520/Xueji/issues/106) `MIR-05` |
| `apps/server/src/modules/module-center/**` | [#68](https://github.com/goldencalf520/Xueji/issues/68) `MOD-01` |
| `apps/server/src/modules/notify/**` | [#31](https://github.com/goldencalf520/Xueji/issues/31) `SRV-12` |
| `apps/server/src/modules/org-sync/**` | [#38](https://github.com/goldencalf520/Xueji/issues/38) `ORG-03` |
| `apps/server/src/modules/org/**` | [#23](https://github.com/goldencalf520/Xueji/issues/23) `SRV-04` → [#37](https://github.com/goldencalf520/Xueji/issues/37) `ORG-02` |
| `apps/server/src/modules/partner/**` | [#44](https://github.com/goldencalf520/Xueji/issues/44) `PTN-01` |
| `apps/server/src/modules/photo/**` | [#176](https://github.com/goldencalf520/Xueji/issues/176) `PHOTO-01` |
| `apps/server/src/modules/plan-ai/**` | [#145](https://github.com/goldencalf520/Xueji/issues/145) `AI-03` |
| `apps/server/src/modules/plan/**` | [#91](https://github.com/goldencalf520/Xueji/issues/91) `PLAN-01` |
| `apps/server/src/modules/points/**` | [#149](https://github.com/goldencalf520/Xueji/issues/149) `PTS-01` |
| `apps/server/src/modules/privacy/**` | [#49](https://github.com/goldencalf520/Xueji/issues/49) `PRV-01` |
| `apps/server/src/modules/privacy/export/**` | [#51](https://github.com/goldencalf520/Xueji/issues/51) `PRV-02` |
| `apps/server/src/modules/qrcode/**` | [#53](https://github.com/goldencalf520/Xueji/issues/53) `QR-01` |
| `apps/server/src/modules/quiz/**` | [#151](https://github.com/goldencalf520/Xueji/issues/151) `QUIZ-01` |
| `apps/server/src/modules/referral-ai/**` | [#147](https://github.com/goldencalf520/Xueji/issues/147) `AI-05` |
| `apps/server/src/modules/referral/**` | [#90](https://github.com/goldencalf520/Xueji/issues/90) `REF-01` |
| `apps/server/src/modules/report-ai/**` | [#146](https://github.com/goldencalf520/Xueji/issues/146) `AI-04` |
| `apps/server/src/modules/report/**` | [#126](https://github.com/goldencalf520/Xueji/issues/126) `RPT-01` |
| `apps/server/src/modules/service-check/**` | [#113](https://github.com/goldencalf520/Xueji/issues/113) `SVC-01` |
| `apps/server/src/modules/settings/**` | [#28](https://github.com/goldencalf520/Xueji/issues/28) `SRV-09` |
| `apps/server/src/modules/speech/**` | [#58](https://github.com/goldencalf520/Xueji/issues/58) `SPEECH-01` → [#106](https://github.com/goldencalf520/Xueji/issues/106) `MIR-05` |
| `apps/server/src/modules/statement/**` | [#136](https://github.com/goldencalf520/Xueji/issues/136) `HOSP-03` |
| `apps/server/src/modules/stats/**` | [#161](https://github.com/goldencalf520/Xueji/issues/161) `STAT-01` → [#162](https://github.com/goldencalf520/Xueji/issues/162) `STAT-02` |
| `apps/server/src/modules/task/**` | [#32](https://github.com/goldencalf520/Xueji/issues/32) `SRV-13` |
| `apps/server/src/modules/tier/**` | [#62](https://github.com/goldencalf520/Xueji/issues/62) `TIER-02` |
| `apps/server/src/modules/transport/**` | [#153](https://github.com/goldencalf520/Xueji/issues/153) `TRN-01` |
| `apps/server/src/modules/wechat/**` | [#29](https://github.com/goldencalf520/Xueji/issues/29) `SRV-10` |
| `apps/server/src/modules/wecom/**` | [#30](https://github.com/goldencalf520/Xueji/issues/30) `SRV-11` |
| `apps/server/src/worker.ts` | [#27](https://github.com/goldencalf520/Xueji/issues/27) `SRV-08` |
| `apps/server/test/authz/**` | [#165](https://github.com/goldencalf520/Xueji/issues/165) `QA-01` |
| `apps/server/test/authz/fixtures/**` | [#24](https://github.com/goldencalf520/Xueji/issues/24) `SRV-05` |
| `docker/compose.prod.yml` | [#34](https://github.com/goldencalf520/Xueji/issues/34) `INF-01` |
| `docker/Dockerfile.server` | [#34](https://github.com/goldencalf520/Xueji/issues/34) `INF-01` |
| `docker/nginx/**` | [#34](https://github.com/goldencalf520/Xueji/issues/34) `INF-01` |
| `docs/design/miniapp-ui.md` | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` |
| `docs/ops/backup-restore.md` | [#167](https://github.com/goldencalf520/Xueji/issues/167) `OPS-01` |
| `docs/ops/db-privileges.md` | [#25](https://github.com/goldencalf520/Xueji/issues/25) `SRV-06` |
| `docs/ops/deploy.md` | [#34](https://github.com/goldencalf520/Xueji/issues/34) `INF-01` |
| `docs/ops/observability.md` | [#35](https://github.com/goldencalf520/Xueji/issues/35) `INF-02` |
| `docs/ops/security-incident.md` | [#167](https://github.com/goldencalf520/Xueji/issues/167) `OPS-01` |
| `docs/ops/sop/**` | [#167](https://github.com/goldencalf520/Xueji/issues/167) `OPS-01` |
| `evals/mirror/**` | [#108](https://github.com/goldencalf520/Xueji/issues/108) `EVAL-02` |
| `evals/plan/**` | [#148](https://github.com/goldencalf520/Xueji/issues/148) `EVAL-01` |
| `evals/reports/mirror-*.md` | [#108](https://github.com/goldencalf520/Xueji/issues/108) `EVAL-02` |
| `evals/reports/plan-*.md` | [#148](https://github.com/goldencalf520/Xueji/issues/148) `EVAL-01` |
| `packages/ai/package.json` | [#97](https://github.com/goldencalf520/Xueji/issues/97) `AI-01` |
| `packages/ai/src/gateway/**` | [#97](https://github.com/goldencalf520/Xueji/issues/97) `AI-01` |
| `packages/ai/src/prompts/hospital-rewrite.ts` | [#147](https://github.com/goldencalf520/Xueji/issues/147) `AI-05` |
| `packages/ai/src/prompts/memory-extract.ts` | [#104](https://github.com/goldencalf520/Xueji/issues/104) `MIR-03` |
| `packages/ai/src/prompts/mirror-persona.ts` | [#99](https://github.com/goldencalf520/Xueji/issues/99) `MIR-01` → [#106](https://github.com/goldencalf520/Xueji/issues/106) `MIR-05` |
| `packages/ai/src/prompts/plan.ts` | [#145](https://github.com/goldencalf520/Xueji/issues/145) `AI-03` |
| `packages/ai/src/prompts/report.ts` | [#146](https://github.com/goldencalf520/Xueji/issues/146) `AI-04` |
| `packages/ai/src/prompts/risk-classify.ts` | [#103](https://github.com/goldencalf520/Xueji/issues/103) `MIR-02` |
| `packages/ai/src/validators/hospital-rewrite.ts` | [#147](https://github.com/goldencalf520/Xueji/issues/147) `AI-05` |
| `packages/ai/src/validators/plan.ts` | [#145](https://github.com/goldencalf520/Xueji/issues/145) `AI-03` |
| `packages/ai/src/validators/report.ts` | [#146](https://github.com/goldencalf520/Xueji/issues/146) `AI-04` |
| `packages/rules/package.json` | [#67](https://github.com/goldencalf520/Xueji/issues/67) `RULE-01` |
| `packages/rules/src/contraindication/**` | [#84](https://github.com/goldencalf520/Xueji/issues/84) `RULE-04` |
| `packages/rules/src/core/**` | [#67](https://github.com/goldencalf520/Xueji/issues/67) `RULE-01` |
| `packages/rules/src/plan-skeleton/**` | [#84](https://github.com/goldencalf520/Xueji/issues/84) `RULE-04` |
| `packages/rules/src/regression/**` | [#116](https://github.com/goldencalf520/Xueji/issues/116) `RULE-05` |
| `packages/rules/src/risk/**` | [#83](https://github.com/goldencalf520/Xueji/issues/83) `RULE-03` |
| `packages/rules/src/rulesets/contraindications.ts` | [#84](https://github.com/goldencalf520/Xueji/issues/84) `RULE-04` |
| `packages/rules/src/rulesets/lifestyle.ts` | [#84](https://github.com/goldencalf520/Xueji/issues/84) `RULE-04` |
| `packages/rules/src/rulesets/plan-packages.ts` | [#84](https://github.com/goldencalf520/Xueji/issues/84) `RULE-04` |
| `packages/rules/src/rulesets/projects.ts` | [#84](https://github.com/goldencalf520/Xueji/issues/84) `RULE-04` |
| `packages/rules/src/rulesets/red-flags.ts` | [#83](https://github.com/goldencalf520/Xueji/issues/83) `RULE-03` |
| `packages/rules/src/rulesets/risk-signals.ts` | [#83](https://github.com/goldencalf520/Xueji/issues/83) `RULE-03` |
| `packages/rules/src/scoring/**` | [#82](https://github.com/goldencalf520/Xueji/issues/82) `RULE-02` |
| `packages/rules/test/regression/**` | [#116](https://github.com/goldencalf520/Xueji/issues/116) `RULE-05` |
| `packages/shared/src/compliance/**` | [#33](https://github.com/goldencalf520/Xueji/issues/33) `SRV-14` |
| `packages/shared/src/contracts/activity.ts` | [#94](https://github.com/goldencalf520/Xueji/issues/94) `ACT-01` |
| `packages/shared/src/contracts/ai.ts` | [#98](https://github.com/goldencalf520/Xueji/issues/98) `AI-02` |
| `packages/shared/src/contracts/alert.ts` | [#87](https://github.com/goldencalf520/Xueji/issues/87) `ALERT-01` |
| `packages/shared/src/contracts/archive.ts` | [#81](https://github.com/goldencalf520/Xueji/issues/81) `ARC-01` |
| `packages/shared/src/contracts/assessment-bank.ts` | [#86](https://github.com/goldencalf520/Xueji/issues/86) `ASM-01` |
| `packages/shared/src/contracts/assessment.ts` | [#89](https://github.com/goldencalf520/Xueji/issues/89) `ASM-02` |
| `packages/shared/src/contracts/audit.ts` | [#25](https://github.com/goldencalf520/Xueji/issues/25) `SRV-06` |
| `packages/shared/src/contracts/auth-admin.ts` | [#43](https://github.com/goldencalf520/Xueji/issues/43) `AUTH-02` |
| `packages/shared/src/contracts/auth-app.ts` | [#40](https://github.com/goldencalf520/Xueji/issues/40) `AUTH-01` |
| `packages/shared/src/contracts/auth-hospital.ts` | [#45](https://github.com/goldencalf520/Xueji/issues/45) `AUTH-03` |
| `packages/shared/src/contracts/checkin.ts` | [#150](https://github.com/goldencalf520/Xueji/issues/150) `CHKIN-01` |
| `packages/shared/src/contracts/checkup-booking.ts` | [#134](https://github.com/goldencalf520/Xueji/issues/134) `CHK-02` |
| `packages/shared/src/contracts/checkup.ts` | [#88](https://github.com/goldencalf520/Xueji/issues/88) `CHK-01` |
| `packages/shared/src/contracts/consent.ts` | [#41](https://github.com/goldencalf520/Xueji/issues/41) `CNS-01` |
| `packages/shared/src/contracts/consumption.ts` | [#61](https://github.com/goldencalf520/Xueji/issues/61) `TIER-01` |
| `packages/shared/src/contracts/customer-admin.ts` | [#50](https://github.com/goldencalf520/Xueji/issues/50) `CUS-02` |
| `packages/shared/src/contracts/customer.ts` | [#36](https://github.com/goldencalf520/Xueji/issues/36) `CUS-01` |
| `packages/shared/src/contracts/dashboard.ts` | [#111](https://github.com/goldencalf520/Xueji/issues/111) `ADM-WB` |
| `packages/shared/src/contracts/device.ts` | [#125](https://github.com/goldencalf520/Xueji/issues/125) `DEV-01` |
| `packages/shared/src/contracts/engine-config.ts` | [#117](https://github.com/goldencalf520/Xueji/issues/117) `ENG-02` |
| `packages/shared/src/contracts/engine.ts` | [#85](https://github.com/goldencalf520/Xueji/issues/85) `ENG-01` |
| `packages/shared/src/contracts/family.ts` | [#79](https://github.com/goldencalf520/Xueji/issues/79) `FAM-01` |
| `packages/shared/src/contracts/file.ts` | [#26](https://github.com/goldencalf520/Xueji/issues/26) `SRV-07` |
| `packages/shared/src/contracts/groupbuy.ts` | [#152](https://github.com/goldencalf520/Xueji/issues/152) `GB-01` |
| `packages/shared/src/contracts/home.ts` | [#69](https://github.com/goldencalf520/Xueji/issues/69) `HOME-01` |
| `packages/shared/src/contracts/hospital-catalog.ts` | [#135](https://github.com/goldencalf520/Xueji/issues/135) `HOSP-02` |
| `packages/shared/src/contracts/hospital-referral.ts` | [#92](https://github.com/goldencalf520/Xueji/issues/92) `HOSP-01` |
| `packages/shared/src/contracts/lead.ts` | [#75](https://github.com/goldencalf520/Xueji/issues/75) `LEAD-01` |
| `packages/shared/src/contracts/measurement.ts` | [#127](https://github.com/goldencalf520/Xueji/issues/127) `DEV-02` |
| `packages/shared/src/contracts/mirror.ts` | [#99](https://github.com/goldencalf520/Xueji/issues/99) `MIR-01` |
| `packages/shared/src/contracts/module.ts` | [#68](https://github.com/goldencalf520/Xueji/issues/68) `MOD-01` |
| `packages/shared/src/contracts/notify.ts` | [#31](https://github.com/goldencalf520/Xueji/issues/31) `SRV-12` |
| `packages/shared/src/contracts/org.ts` | [#23](https://github.com/goldencalf520/Xueji/issues/23) `SRV-04` → [#37](https://github.com/goldencalf520/Xueji/issues/37) `ORG-02` |
| `packages/shared/src/contracts/partner.ts` | [#44](https://github.com/goldencalf520/Xueji/issues/44) `PTN-01` |
| `packages/shared/src/contracts/photo.ts` | [#176](https://github.com/goldencalf520/Xueji/issues/176) `PHOTO-01` |
| `packages/shared/src/contracts/plan.ts` | [#91](https://github.com/goldencalf520/Xueji/issues/91) `PLAN-01` |
| `packages/shared/src/contracts/points.ts` | [#149](https://github.com/goldencalf520/Xueji/issues/149) `PTS-01` |
| `packages/shared/src/contracts/privacy-export.ts` | [#51](https://github.com/goldencalf520/Xueji/issues/51) `PRV-02` |
| `packages/shared/src/contracts/privacy.ts` | [#49](https://github.com/goldencalf520/Xueji/issues/49) `PRV-01` |
| `packages/shared/src/contracts/profile.ts` | [#42](https://github.com/goldencalf520/Xueji/issues/42) `APP-01` |
| `packages/shared/src/contracts/qrcode.ts` | [#53](https://github.com/goldencalf520/Xueji/issues/53) `QR-01` |
| `packages/shared/src/contracts/quiz.ts` | [#151](https://github.com/goldencalf520/Xueji/issues/151) `QUIZ-01` |
| `packages/shared/src/contracts/referral.ts` | [#90](https://github.com/goldencalf520/Xueji/issues/90) `REF-01` |
| `packages/shared/src/contracts/report.ts` | [#126](https://github.com/goldencalf520/Xueji/issues/126) `RPT-01` |
| `packages/shared/src/contracts/service-check.ts` | [#113](https://github.com/goldencalf520/Xueji/issues/113) `SVC-01` |
| `packages/shared/src/contracts/settings.ts` | [#28](https://github.com/goldencalf520/Xueji/issues/28) `SRV-09` |
| `packages/shared/src/contracts/speech.ts` | [#58](https://github.com/goldencalf520/Xueji/issues/58) `SPEECH-01` |
| `packages/shared/src/contracts/statement.ts` | [#136](https://github.com/goldencalf520/Xueji/issues/136) `HOSP-03` |
| `packages/shared/src/contracts/stats.ts` | [#161](https://github.com/goldencalf520/Xueji/issues/161) `STAT-01` |
| `packages/shared/src/contracts/task.ts` | [#32](https://github.com/goldencalf520/Xueji/issues/32) `SRV-13` |
| `packages/shared/src/contracts/tier.ts` | [#62](https://github.com/goldencalf520/Xueji/issues/62) `TIER-02` |
| `packages/shared/src/contracts/transport.ts` | [#153](https://github.com/goldencalf520/Xueji/issues/153) `TRN-01` |
| `packages/shared/src/permissions.ts` | [#23](https://github.com/goldencalf520/Xueji/issues/23) `SRV-04` |

## 按 wave 查 issue

| wave | issue | 标题 | 版本 | 依赖 |
|---|---|---|---|---|
| 1 | [#46](https://github.com/goldencalf520/Xueji/issues/46) `ADM-01` | 管理端框架与通用组件：布局、菜单权限、水印、表格分页、上传等 | V1.0 | — |
| 1 | [#97](https://github.com/goldencalf520/Xueji/issues/97) `AI-01` | AI 网关（packages/ai）：统一 chat、OpenAI 兼容适配、脱敏、重试、熔断 ⚠️ | V1.0 | — |
| 1 | [#34](https://github.com/goldencalf520/Xueji/issues/34) `INF-01` | 部署流水线：Docker 镜像、预发 / 生产 compose、Nginx、GitHub Actions 部署 | V1.0 | — |
| 1 | [#57](https://github.com/goldencalf520/Xueji/issues/57) `MP-02` | 小程序设计令牌、乐龄模式主题、自定义 tabBar 与基础组件 | V1.0 | — |
| 1 | [#67](https://github.com/goldencalf520/Xueji/issues/67) `RULE-01` | 规则引擎核心：JSON Logic 执行器、自定义操作符、规则集求值与等级合并 ⚠️ | V1.0 | — |
| 1 | [#82](https://github.com/goldencalf520/Xueji/issues/82) `RULE-02` | 计分与量表：维度分、六维指数、OSTA、SARC-F、PHQ-2、GAD-2、BMI、坐站参考值 ⚠️ | V1.1 | — |
| 1 | [#20](https://github.com/goldencalf520/Xueji/issues/20) `SRV-01` | 接口防护：Idempotency-Key 幂等、限流、防重放、游标分页工具 | V1.0 | — |
| 1 | [#21](https://github.com/goldencalf520/Xueji/issues/21) `SRV-02` | 字段加密：AES-256-GCM 信封加密、HMAC 查找哈希、KMS 适配、Prisma 自动加解密 ⚠️ | V1.0 | — |
| 1 | [#22](https://github.com/goldencalf520/Xueji/issues/22) `SRV-03` | 令牌与鉴权：JWT 三端隔离、刷新令牌、全局 AuthGuard ⚠️ | V1.0 | — |
| 1 | [#27](https://github.com/goldencalf520/Xueji/issues/27) `SRV-08` | 队列与定时任务框架：BullMQ、worker 进程、定时任务注册约定 | V1.0 | — |
| 1 | [#29](https://github.com/goldencalf520/Xueji/issues/29) `SRV-10` | 微信小程序服务端 SDK：access_token、code2Session、手机号、订阅消息、小程序码 | V1.0 | — |
| 1 | [#33](https://github.com/goldencalf520/Xueji/issues/33) `SRV-14` | 合规禁用词校验器（附录 I） ⚠️ | V1.0 | — |
| 2 | [#36](https://github.com/goldencalf520/Xueji/issues/36) `CUS-01` | 客户核心域：客户、运营标签、小程序码、健康标签 schema 与服务 | V1.0 | #21 |
| 2 | [#167](https://github.com/goldencalf520/Xueji/issues/167) `OPS-01` | 运维与运营支撑文档：备份恢复演练、数据安全事件预案、SOP 落地 | V1.1 | #34 |
| 2 | [#83](https://github.com/goldencalf520/Xueji/issues/83) `RULE-03` | 红旗（附录 A）与风险信号（附录 B）规则集 + 单题即时 L3 检查 ⚠️ | V1.1 | #67 #82 |
| 2 | [#84](https://github.com/goldencalf520/Xueji/issues/84) `RULE-04` | 禁忌筛查（附录 D）与方案骨架生成（附录 E、§4.7） ⚠️ | V1.1 | #67 |
| 2 | [#23](https://github.com/goldencalf520/Xueji/issues/23) `SRV-04` | 组织与账号域：门店 / 员工 / 角色 / 权限码 schema、权限矩阵种子、OrgService | V1.0 | #21 |
| 2 | [#30](https://github.com/goldencalf520/Xueji/issues/30) `SRV-11` | 企业微信 SDK：通讯录、网页授权、扫码登录、应用消息、群机器人、回调、JS-SDK 签名 | V1.0 | #22 |
| 2 | [#161](https://github.com/goldencalf520/Xueji/issues/161) `STAT-01` | 埋点接收：/app/events 批量上报、服务端事件、前端错误上报、按月分区与 13 个月保留 | V1.0 | #27 #22 |
| 3 | [#40](https://github.com/goldencalf520/Xueji/issues/40) `AUTH-01` | 小程序登录与归属：wx-login、手机号快速验证、老客户匹配、短码归属 | V1.0 | #36 #22 #29 |
| 3 | [#35](https://github.com/goldencalf520/Xueji/issues/35) `INF-02` | 可观测性与告警：就绪检查、错误率 / 慢请求 / 队列积压 / AI 失败 / 预警超时告警 | V1.1 | #27 #30 |
| 3 | [#116](https://github.com/goldencalf520/Xueji/issues/116) `RULE-05` | 规则回归测试集（300 个虚构客户）与版本差异比较工具 ⚠️ | V1.1 | #83 #84 |
| 3 | [#24](https://github.com/goldencalf520/Xueji/issues/24) `SRV-05` | RBAC 与数据范围：@Permission 守卫、all / store / self 注入、医院端强制 hospital_id ⚠️ | V1.0 | #22 #23 |
| 3 | [#31](https://github.com/goldencalf520/Xueji/issues/31) `SRV-12` | 消息通知中心：订阅消息、企微应用消息、短信、站内消息 | V1.0 | #27 #29 #30 |
| 4 | [#43](https://github.com/goldencalf520/Xueji/issues/43) `AUTH-02` | 管理端登录：账号密码 + 图形验证码 + 短信动态码、企微扫码、移动工作台免登 ⚠️ | V1.0 | #24 #30 #31 |
| 4 | [#85](https://github.com/goldencalf520/Xueji/issues/85) `ENG-01` | 规则引擎服务端：方案引擎配置表、附录 A/B/D/E 种子、EngineService ⚠️ | V1.1 | #83 #84 #24 |
| 4 | [#56](https://github.com/goldencalf520/Xueji/issues/56) `MP-01` | 小程序请求层、登录态与埋点 SDK | V1.0 | #40 |
| 4 | [#25](https://github.com/goldencalf520/Xueji/issues/25) `SRV-06` | 审计日志：audit_log（只追加）、@Audit 拦截器、查询 API ⚠️ | V1.0 | #24 |
| 5 | [#94](https://github.com/goldencalf520/Xueji/issues/94) `ACT-01` | 活动：讲座 / 健康日 / 生日会 / 茶话会的报名与扫码签到 | V1.0 | #36 #31 #25 |
| 5 | [#47](https://github.com/goldencalf520/Xueji/issues/47) `ADM-02` | 管理端登录与会话：双因素登录页、企微扫码、强制改密、令牌刷新、空闲退出 | V1.0 | #46 #43 |
| 5 | [#50](https://github.com/goldencalf520/Xueji/issues/50) `CUS-02` | 管理端客户 API：列表筛选、详情概览、分配顾问、标签、跟进记录、客户摘要表 | V1.0 | #36 #25 |
| 5 | [#65](https://github.com/goldencalf520/Xueji/issues/65) `MP-MSG` | 小程序 P-40 消息中心与订阅消息授权封装 | V1.1 | #56 #31 |
| 5 | [#37](https://github.com/goldencalf520/Xueji/issues/37) `ORG-02` | 门店 / 员工 / 角色管理 API | V1.0 | #25 #36 |
| 5 | [#26](https://github.com/goldencalf520/Xueji/issues/26) `SRV-07` | 文件服务：私有桶、上传凭证、10 分钟签名链接、敏感级别 ⚠️ | V1.0 | #24 #25 |
| 5 | [#28](https://github.com/goldencalf520/Xueji/issues/28) `SRV-09` | 字典与系统参数：dict_item、system_setting、缓存与管理 API | V1.0 | #25 |
| 6 | [#95](https://github.com/goldencalf520/Xueji/issues/95) `ACT-02` | 管理端：活动管理页（报名名单、签到统计） | V1.0 | #94 #47 |
| 6 | [#96](https://github.com/goldencalf520/Xueji/issues/96) `ACT-03` | 小程序 P-43 活动详情与报名 | V1.0 | #94 #57 #56 |
| 6 | [#55](https://github.com/goldencalf520/Xueji/issues/55) `ADM-04` | 移动工作台框架：企业微信免登、Vant 布局、JS-SDK 扫码封装 | V1.0 | #47 #30 |
| 6 | [#98](https://github.com/goldencalf520/Xueji/issues/98) `AI-02` | 服务端 AI 模块：调用记录、限流、内容安全、开关与预算告警 | V1.0 | #97 #28 #30 |
| 6 | [#86](https://github.com/goldencalf520/Xueji/issues/86) `ASM-01` | 测评题库：模板版本、关卡、题目、显示条件、模拟、发布 + 附录 C 题库 v1 种子 ⚠️ | V1.1 | #85 #26 |
| 6 | [#41](https://github.com/goldencalf520/Xueji/issues/41) `CNS-01` | 授权中心：C1–C9 授权文本版本、授权记录、撤回事件、@RequireConsent ⚠️ | V1.0 | #36 #26 |
| 6 | [#125](https://github.com/goldencalf520/Xueji/issues/125) `DEV-01` | 设备准入：登记、审核状态机、指标白名单、报告模板配置 ⚠️ | V1.1 | #26 #25 |
| 6 | [#117](https://github.com/goldencalf520/Xueji/issues/117) `ENG-02` | 方案引擎配置 API：项目库、方案包、规则发布流程（医生确认 + 回归集 + 超管发布）、话术 ⚠️ | V1.1 | #85 #116 #26 |
| 6 | [#44](https://github.com/goldencalf520/Xueji/issues/44) `PTN-01` | 合作方域：医院、医院账号、旅行社 / 机构及资质到期管理 | V1.0 | #26 #31 |
| 6 | [#53](https://github.com/goldencalf520/Xueji/issues/53) `QR-01` | 小程序码管理：短码生成、小程序码图片、扫码统计 | V1.0 | #36 #29 #26 #47 #40 |
| 6 | [#58](https://github.com/goldencalf520/Xueji/issues/58) `SPEECH-01` | 语音服务：语音识别（普通话）、语音合成、音频 24 小时清理 | V1.0 | #26 #27 |
| 6 | [#32](https://github.com/goldencalf520/Xueji/issues/32) `SRV-13` | 任务与时限（SLA）：task 表、到期提醒、超时升级、任务 API | V1.0 | #28 #31 |
| 6 | [#113](https://github.com/goldencalf520/Xueji/issues/113) `SVC-01` | 服务前禁忌口头确认记录（仪器类、热疗类、深层手法类项目） ⚠️ | V1.1 | #85 #50 |
| 6 | [#61](https://github.com/goldencalf520/Xueji/issues/61) `TIER-01` | 消费流水导入：CSV 模板、预检、后台导入、客户匹配与归属 | V1.0 | #36 #26 #27 #24 |
| 7 | [#87](https://github.com/goldencalf520/Xueji/issues/87) `ALERT-01` | 风险预警：L3 / L2 / 魔镜 high / watch，时限、升级、联系记录、关闭复核、门店项目暂停 ⚠️ | V1.0 | #32 #50 |
| 7 | [#42](https://github.com/goldencalf520/Xueji/issues/42) `APP-01` | 用户端个人资料与设置：/app/me、乐龄模式开启规则 | V1.0 | #40 #41 |
| 7 | [#119](https://github.com/goldencalf520/Xueji/issues/119) `ASM-03` | 管理端：测评题库页（题目编辑、显示条件、模拟、发布） | V1.1 | #86 #47 |
| 7 | [#45](https://github.com/goldencalf520/Xueji/issues/45) `AUTH-03` | 医院端登录：账号密码 + 短信动态码 ⚠️ | V1.1 | #44 #31 |
| 7 | [#88](https://github.com/goldencalf520/Xueji/issues/88) `CHK-01` | 体检券：医疗服务目录、体检套餐、号源表、发券资格、到店核销、作废与过期 ⚠️ | V1.1 | #41 #44 #84 #32 |
| 7 | [#48](https://github.com/goldencalf520/Xueji/issues/48) `CNS-02` | 管理端：合规文本（授权文本）管理页 | V1.0 | #41 #47 |
| 7 | [#52](https://github.com/goldencalf520/Xueji/issues/52) `CUS-03` | 管理端客户列表与详情页（含标签页注册机制） | V1.0 | #50 #47 #41 |
| 7 | [#128](https://github.com/goldencalf520/Xueji/issues/128) `DEV-03` | 管理端：设备登记、准入审核、指标白名单、报告模板配置页 | V1.1 | #125 #47 |
| 7 | [#118](https://github.com/goldencalf520/Xueji/issues/118) `ENG-03` | 管理端：方案引擎配置页（项目库、方案包、禁忌 / 红旗 / 风险规则、生活建议、话术） | V1.1 | #117 #47 |
| 7 | [#79](https://github.com/goldencalf520/Xueji/issues/79) `FAM-01` | 家人绑定：双向邀请确认、C6 按范围授权、FamilyAccessService ⚠️ | V1.0 | #41 #31 #50 |
| 7 | [#109](https://github.com/goldencalf520/Xueji/issues/109) `MOB-01` | 移动工作台：我的任务、客户搜索、客户卡片 | V1.0 | #55 #32 #50 |
| 7 | [#68](https://github.com/goldencalf520/Xueji/issues/68) `MOD-01` | 模块管理：配置、合规审核流转、可见性计算、健康提示、/app/modules/{code} | V1.0 | #36 #33 #67 #44 |
| 7 | [#59](https://github.com/goldencalf520/Xueji/issues/59) `MP-03` | 小程序语音能力：按住说话、语音识别、朗读播放 | V1.0 | #58 #56 |
| 7 | [#38](https://github.com/goldencalf520/Xueji/issues/38) `ORG-03` | 企业微信通讯录同步与员工离职客户转移 | V1.0 | #37 #30 #32 |
| 7 | [#49](https://github.com/goldencalf520/Xueji/issues/49) `PRV-01` | 隐私数据请求：个人数据导出、注销（15 个工作日）、各域导出 / 删除注册机制 ⚠️ | V1.0 | #41 #32 |
| 7 | [#74](https://github.com/goldencalf520/Xueji/issues/74) `PTN-02` | 管理端：合作方页面（医院、医院账号、旅行社 / 机构资质） | V1.0 | #44 #47 |
| 7 | [#62](https://github.com/goldencalf520/Xueji/issues/62) `TIER-02` | 会员分级：首批阈值、模拟发布、每日升级、月度保级 / 降级、人工调整、/app/tier | V1.0 | #61 #28 #31 |
| 8 | [#54](https://github.com/goldencalf520/Xueji/issues/54) `ADM-03` | 医院端框架与登录：独立入口、账号 + 短信登录、菜单、水印 | V1.1 | #47 #45 |
| 8 | [#111](https://github.com/goldencalf520/Xueji/issues/111) `ADM-WB` | 管理端工作台：我的待办、预警置顶、今日、数据卡片 | V1.0 | #32 #87 #47 |
| 8 | [#101](https://github.com/goldencalf520/Xueji/issues/101) `ALERT-02` | 管理端：风险预警页 + 客户详情"预警"标签页 ⚠️ | V1.0 | #87 #52 |
| 8 | [#81](https://github.com/goldencalf520/Xueji/issues/81) `ARC-01` | 健康档案：h_record 时间轴、档案总览、指标趋势、ArchiveService.append ⚠️ | V1.1 | #41 #49 #50 |
| 8 | [#152](https://github.com/goldencalf520/Xueji/issues/152) `GB-01` | 结伴拼团（预约制）：发起、参团、48 小时关闭、成团通知顾问 | V1.2 | #68 #32 |
| 8 | [#69](https://github.com/goldencalf520/Xueji/issues/69) `HOME-01` | 首页配置：6 套布局版本管理、发布校验、/app/home 解析与缓存 | V1.0 | #68 |
| 8 | [#135](https://github.com/goldencalf520/Xueji/issues/135) `HOSP-02` | 医院端：号源设置、服务与套餐变更申请、本院账号管理 | V1.1 | #88 #45 |
| 8 | [#75](https://github.com/goldencalf520/Xueji/issues/75) `LEAD-01` | 线索：意向提交、健康提示确认、分配、时限、跟进、转交、成交 / 丢单 | V1.0 | #68 #32 |
| 8 | [#99](https://github.com/goldencalf520/Xueji/issues/99) `MIR-01` | 魔镜基础版：人设 P4、会话、流式回复、关键词风险规则、用量限制、30 天清理 ⚠️ | V1.0 | #98 #58 #87 |
| 8 | [#112](https://github.com/goldencalf520/Xueji/issues/112) `MOB-03` | 移动工作台：扫码核销体检券与活动签到 | V1.1 | #55 #88 #94 |
| 8 | [#110](https://github.com/goldencalf520/Xueji/issues/110) `MOB-05` | 移动工作台：预警处理（联系结果记录、未接通重拨提醒） ⚠️ | V1.0 | #55 #87 |
| 8 | [#71](https://github.com/goldencalf520/Xueji/issues/71) `MOD-02` | 管理端：模块管理页（表单设计器、健康提示、合规审核、手机预览） | V1.0 | #68 #47 |
| 8 | [#60](https://github.com/goldencalf520/Xueji/issues/60) `MP-AUTH` | 小程序 P-05 登录、P-06 通用授权页、P-07 基础资料 | V1.0 | #56 #57 #41 #42 |
| 8 | [#51](https://github.com/goldencalf520/Xueji/issues/51) `PRV-02` | 后台数据导出审批：申请、审批、水印、24 小时链接、默认脱敏 ⚠️ | V1.0 | #49 #50 |
| 8 | [#66](https://github.com/goldencalf520/Xueji/issues/66) `TIER-03` | 管理端：分级管理页、消费流水导入页、客户详情"消费"标签页 | V1.0 | #62 #52 |
| 9 | [#89](https://github.com/goldencalf520/Xueji/issues/89) `ASM-02` | 测评作答：开始（需 C2）、逐题保存与即时 L3、陪填 / 家人代填、完成计算与后处理 ⚠️ | V1.1 | #86 #87 #81 #88 #79 |
| 9 | [#139](https://github.com/goldencalf520/Xueji/issues/139) `CHK-03` | 管理端：体检券页、医疗服务目录与体检套餐页 | V1.1 | #88 #135 #47 |
| 9 | [#72](https://github.com/goldencalf520/Xueji/issues/72) `HOME-02` | 管理端：首页配置页（组件库 / 拖拽预览 / 属性面板、发布与回滚） | V1.0 | #69 #47 |
| 9 | [#76](https://github.com/goldencalf520/Xueji/issues/76) `LEAD-02` | 管理端：线索管理页 + 客户详情"线索"标签页 | V1.0 | #75 #52 |
| 9 | [#103](https://github.com/goldencalf520/Xueji/issues/103) `MIR-02` | 魔镜风险分类 P5：关键词 + 模型并用，high / watch 分级处理 ⚠️ | V1.2 | #99 #79 |
| 9 | [#102](https://github.com/goldencalf520/Xueji/issues/102) `MIR-06` | 管理端：魔镜人设配置页与魔镜风险预警列表 | V1.0 | #99 #101 |
| 9 | [#159](https://github.com/goldencalf520/Xueji/issues/159) `MKT-2` | 管理端：结伴拼团活动管理 | V1.2 | #152 #47 |
| 9 | [#78](https://github.com/goldencalf520/Xueji/issues/78) `MOB-02` | 移动工作台：线索跟进 | V1.0 | #75 #55 |
| 9 | [#131](https://github.com/goldencalf520/Xueji/issues/131) `MP-ARC-1` | 小程序 P-02 档案总览、P-15 时间轴 | V1.1 | #81 #57 #56 |
| 9 | [#80](https://github.com/goldencalf520/Xueji/issues/80) `MP-FAM` | 小程序 P-32 邀请家人、P-33 接受邀请、P-34 家人列表 | V1.0 | #79 #60 |
| 9 | [#156](https://github.com/goldencalf520/Xueji/issues/156) `MP-GB` | 小程序 P-31 结伴拼团 | V1.2 | #152 #57 |
| 9 | [#73](https://github.com/goldencalf520/Xueji/issues/73) `MP-HOME` | 小程序 P-01 配置驱动首页：10 种组件、等级皮肤、乐龄差异、离线回退 | V1.0 | #69 #57 #56 |
| 9 | [#63](https://github.com/goldencalf520/Xueji/issues/63) `MP-ME-1` | 小程序 P-04 我的、P-36 会员等级与权益、P-37 设置、P-42 关于 | V1.0 | #60 #62 |
| 9 | [#64](https://github.com/goldencalf520/Xueji/issues/64) `MP-ME-2` | 小程序 P-38 授权管理、P-39 隐私与数据 | V1.0 | #60 #49 |
| 9 | [#100](https://github.com/goldencalf520/Xueji/issues/100) `MP-MIR` | 小程序 P-03 魔镜：按住说话、流式显示、自动朗读、快捷话题、安全卡片 | V1.0 | #99 #59 #57 |
| 9 | [#77](https://github.com/goldencalf520/Xueji/issues/77) `MP-MOD` | 小程序 P-23 模块详情、P-24 意向表单、P-25 海外 VIP、商城跳转 | V1.0 | #75 #57 #56 |
| 9 | [#126](https://github.com/goldencalf520/Xueji/issues/126) `RPT-01` | 报告：8 部分结构生成、需看医生规则、审核、PDF 与签名链接 ⚠️ | V1.1 | #125 #81 #85 |
| 9 | [#70](https://github.com/goldencalf520/Xueji/issues/70) `SEED-01` | 初始配置种子：附录 G 模块初始配置 + 附录 H 首页布局（6 套） | V1.0 | #69 |
| 10 | [#146](https://github.com/goldencalf520/Xueji/issues/146) `AI-04` | AI 门店测量报告解读 P2（插件接入 report）+ 句子缓存 ⚠️ | V1.2 | #126 #98 |
| 10 | [#160](https://github.com/goldencalf520/Xueji/issues/160) `ANNUAL-01` | 年度个人健康报告（臻享权益） | V1.2 | #126 #89 |
| 10 | [#120](https://github.com/goldencalf520/Xueji/issues/120) `ASM-04` | 管理端：测评记录页 + 客户详情"测评与档案"标签页（仅健康顾问看完整内容） ⚠️ | V1.1 | #89 #52 |
| 10 | [#127](https://github.com/goldencalf520/Xueji/issues/127) `DEV-02` | 门店测量数据导入：字段映射、客户匹配、预检、写档案、血压红旗预警 ⚠️ | V1.1 | #126 #87 |
| 10 | [#108](https://github.com/goldencalf520/Xueji/issues/108) `EVAL-02` | 魔镜红队评测集（120 条）与评测脚本 ⚠️ | V1.2 | #103 |
| 10 | [#104](https://github.com/goldencalf520/Xueji/issues/104) `MIR-03` | 魔镜记忆 P6（需 C9）与抽检接口 | V1.2 | #103 |
| 10 | [#114](https://github.com/goldencalf520/Xueji/issues/114) `MOB-04` | 移动工作台：陪填测评（6 位陪填码）与服务前禁忌确认 | V1.1 | #55 #89 #113 |
| 10 | [#121](https://github.com/goldencalf520/Xueji/issues/121) `MP-ASM-1` | 小程序 P-08 测评介绍（C2、填写方式）、P-09 关卡地图 | V1.1 | #89 #60 |
| 10 | [#176](https://github.com/goldencalf520/Xueji/issues/176) `PHOTO-01` | 皮肤 / 体态照片与 P-18 照片对比（需 C5，仅本人可见，可单张删除） ⚠️ | V1.2 | #81 #131 |
| 10 | [#149](https://github.com/goldencalf520/Xueji/issues/149) `PTS-01` | 健康存折（积分）：获取规则与上限、兑换与库存、12 个月过期 | V1.2 | #89 #94 #113 |
| 10 | [#90](https://github.com/goldencalf520/Xueji/issues/90) `REF-01` | 转介单：创建与共享字段快照（加密冻结）、状态机、取消、催办、回传持久化 ⚠️ | V1.1 | #89 #44 |
| 10 | [#130](https://github.com/goldencalf520/Xueji/issues/130) `RPT-02` | 管理端：报告审核页 | V1.1 | #126 #47 |
| 11 | [#134](https://github.com/goldencalf520/Xueji/issues/134) `CHK-02` | 体检预约：号源余量、预约（需 C3 / 可选 C4）、取消、订阅消息与前一天提醒 | V1.1 | #88 #90 |
| 11 | [#150](https://github.com/goldencalf520/Xueji/issues/150) `CHKIN-01` | 打卡：睡眠 / 运动 / 喝水 / 经期日记（需 C2、加密）、连续天数、经期标签 ⚠️ | V1.2 | #149 #81 |
| 11 | [#129](https://github.com/goldencalf520/Xueji/issues/129) `DEV-04` | 管理端：测量数据导入向导 | V1.1 | #127 #47 |
| 11 | [#92](https://github.com/goldencalf520/Xueji/issues/92) `HOSP-01` | 医院端转介 API：列表、详情（解密快照 + 审计）、接收 / 拒绝、预约、到院、回传 ⚠️ | V1.1 | #90 #45 #81 |
| 11 | [#105](https://github.com/goldencalf520/Xueji/issues/105) `MIR-04` | 小程序 P-41 魔镜记得的事 + 首次使用魔镜时询问 C9 | V1.2 | #104 #100 |
| 11 | [#106](https://github.com/goldencalf520/Xueji/issues/106) `MIR-05` | 魔镜粤语：粤语识别 / 合成、粤语人设指令、语言设置 | V1.2 | #104 |
| 11 | [#107](https://github.com/goldencalf520/Xueji/issues/107) `MIR-07` | 管理端：魔镜对话抽检页 | V1.2 | #104 #102 |
| 11 | [#122](https://github.com/goldencalf520/Xueji/issues/122) `MP-ASM-2` | 小程序 P-10 答题：8 种题型组件、一页一题、自动朗读、语音作答、L3 即时跳转 ⚠️ | V1.1 | #121 #59 |
| 11 | [#123](https://github.com/goldencalf520/Xueji/issues/123) `MP-ASM-3` | 小程序 P-11 坐站测试、P-12 单腿站立、P-13 紧急提示 ⚠️ | V1.1 | #121 |
| 11 | [#124](https://github.com/goldencalf520/Xueji/issues/124) `MP-ASM-4` | 小程序 P-14 测评结果：乐龄三件事、雷达图对比、就医建议、初步方案、分享海报 | V1.1 | #121 #59 |
| 11 | [#91](https://github.com/goldencalf520/Xueji/issues/91) `PLAN-01` | 养护方案：骨架生成、模板文案、合规校验、审核策略、发送、/app/plans ⚠️ | V1.1 | #85 #90 #33 |
| 11 | [#151](https://github.com/goldencalf520/Xueji/issues/151) `QUIZ-01` | 每日健康问答：题库、每日 3 题、答题与积分 | V1.2 | #149 |
| 11 | [#140](https://github.com/goldencalf520/Xueji/issues/140) `REF-03` | 管理端：转介单页 + 客户详情"转介"标签页 | V1.1 | #90 #52 |
| 12 | [#145](https://github.com/goldencalf520/Xueji/issues/145) `AI-03` | AI 方案文案 P1：提示词、输出校验链、重试与模板回退 ⚠️ | V1.2 | #91 #98 |
| 12 | [#147](https://github.com/goldencalf520/Xueji/issues/147) `AI-05` | AI 医生原话通俗化 P3：数字日期一致性校验，失败只展示原文 ⚠️ | V1.2 | #92 #98 |
| 12 | [#93](https://github.com/goldencalf520/Xueji/issues/93) `FAM-02` | 家人视角首页 P-35：子女版摘要（按授权范围） | V1.1 | #79 #80 #81 #91 #92 |
| 12 | [#136](https://github.com/goldencalf520/Xueji/issues/136) `HOSP-03` | 医院对账：月度对账单、医院确认 / 异议、财务处理 | V1.1 | #134 #92 |
| 12 | [#137](https://github.com/goldencalf520/Xueji/issues/137) `HOSP-04` | 医院端页面：转介单列表、详情、接收 / 预约 / 到院、回传表单 | V1.1 | #92 #54 |
| 12 | [#158](https://github.com/goldencalf520/Xueji/issues/158) `MKT-1` | 管理端：健康存折规则与兑换项目、每日问答题库 | V1.2 | #149 #151 #47 |
| 12 | [#115](https://github.com/goldencalf520/Xueji/issues/115) `MOB-06` | 移动工作台：方案发送（预览客户版 → 复制 → 回企微发送 → 标记已发送） | V1.1 | #55 #91 |
| 12 | [#132](https://github.com/goldencalf520/Xueji/issues/132) `MP-ARC-2` | 小程序 P-16 报告详情（8 部分、朗读、PDF）、P-17 指标趋势 | V1.1 | #126 #131 #124 |
| 12 | [#133](https://github.com/goldencalf520/Xueji/issues/133) `MP-ARC-3` | 小程序 P-19 医院报告（医生原文、通俗版、复查日期、PDF 原件） | V1.1 | #92 #131 |
| 12 | [#142](https://github.com/goldencalf520/Xueji/issues/142) `MP-CHK` | 小程序 P-21 体检券、P-22 体检预约（含 C3 / C4 授权与订阅消息） | V1.1 | #134 #60 #65 |
| 12 | [#155](https://github.com/goldencalf520/Xueji/issues/155) `MP-GAME` | 小程序 P-29 每日健康问答、P-30 记忆翻牌 | V1.2 | #151 #57 |
| 12 | [#144](https://github.com/goldencalf520/Xueji/issues/144) `MP-PLAN` | 小程序 P-20 我的方案 | V1.1 | #91 #57 #56 |
| 12 | [#154](https://github.com/goldencalf520/Xueji/issues/154) `MP-PTS` | 小程序 P-27 健康存折、P-28 打卡 | V1.2 | #150 #57 |
| 12 | [#143](https://github.com/goldencalf520/Xueji/issues/143) `PLAN-02` | 管理端：方案管理页 + 客户详情"方案"标签页 | V1.1 | #91 #52 |
| 12 | [#165](https://github.com/goldencalf520/Xueji/issues/165) `QA-01` | 越权与授权缺失测试套件 + CI 接口测试任务 ⚠️ | V1.1 | #92 #79 #89 #50 |
| 12 | [#162](https://github.com/goldencalf520/Xueji/issues/162) `STAT-02` | 指标聚合与看板 API：北极星、漏斗、分级、模块、门店、顾问、安全、AI 质量、医院 | V1.2 | #161 #91 #134 #75 #99 #98 #62 |
| 12 | [#153](https://github.com/goldencalf520/Xueji/issues/153) `TRN-01` | 接送预约与调度任务（臻享 / 70 岁以上陪同） | V1.2 | #134 |
| 13 | [#148](https://github.com/goldencalf520/Xueji/issues/148) `EVAL-01` | 方案文案评测集（150 例）与评测脚本、人工评分表 ⚠️ | V1.2 | #145 |
| 13 | [#163](https://github.com/goldencalf520/Xueji/issues/163) `HOME-03` | 首页 A/B 测试：同等级两套布局、按客户 ID 哈希分流、看板对比 | V1.2 | #72 #162 |
| 13 | [#138](https://github.com/goldencalf520/Xueji/issues/138) `HOSP-05` | 医院端页面：预约日历与号源、服务与套餐、对账、账号设置 | V1.1 | #135 #136 #54 |
| 13 | [#157](https://github.com/goldencalf520/Xueji/issues/157) `MP-TRN` | 小程序 P-26 接送预约 | V1.2 | #153 #57 |
| 13 | [#166](https://github.com/goldencalf520/Xueji/issues/166) `QA-02` | 小程序端到端测试（miniprogram-automator）：登录、首页、答题、预约 | V1.1 | #73 #122 #142 |
| 13 | [#164](https://github.com/goldencalf520/Xueji/issues/164) `STAT-03` | 管理端：数据看板页（ECharts） | V1.2 | #162 #47 |
| 13 | [#141](https://github.com/goldencalf520/Xueji/issues/141) `STMT-ADM` | 管理端：医院对账页（财务） | V1.1 | #136 #47 |

## 需人工完成的事项

- [#39](https://github.com/goldencalf520/Xueji/issues/39) `INF-04` 云资源与平台账号开通（企业主体）
- [#168](https://github.com/goldencalf520/Xueji/issues/168) `QA-03` 上线前检查、乐龄可用性测试与试点验收（UAT）
- [#169](https://github.com/goldencalf520/Xueji/issues/169) `H-01` 门店真实项目清单与属性 / 禁忌确认（含美团"雪姬 AI 智能健康美容体验馆（五月花店）"项目）
- [#170](https://github.com/goldencalf520/Xueji/issues/170) `H-02` 合作医生书面确认：红旗、风险信号、禁忌规则与题库阈值
- [#171](https://github.com/goldencalf520/Xueji/issues/171) `H-03` 法务：隐私政策、用户协议、C1–C9 授权文本、个人信息保护影响评估
- [#172](https://github.com/goldencalf520/Xueji/issues/172) `H-04` 合作医院：名单、执业范围、体检套餐、协议价、号源、体检券有效期
- [#173](https://github.com/goldencalf520/Xueji/issues/173) `H-05` 品牌 VI、魔镜名字与形象、实拍照片与示范视频
- [#174](https://github.com/goldencalf520/Xueji/issues/174) `H-06` 门店设备清单与鹰眼设备资料核实
- [#175](https://github.com/goldencalf520/Xueji/issues/175) `H-07` 其余待确认事项（附录 L）：储值口径、臻享权益成本、商城 SaaS、文旅与海外资质、主体类目、粤语、AED、业绩归属
