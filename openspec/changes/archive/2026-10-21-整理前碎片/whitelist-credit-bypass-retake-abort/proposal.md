## Why

白名单「允许突破本学期学分要求」仅为布尔，无法表达可超 1–3 学分；重修通过后缴费时限按天（默认 2 天），与 72 小时诉求不符；审批历史无法在学生取消重修意愿时中止已通过待付款申请与账单。

## What Changes

- 白名单该权限改为勾选 + 数值（1–3，默认 3），挂 `bypassCreditMax.extraCredits`；选课闸门按额度放行。
- 含重修且生成账单的审批通过：`paymentDueAt` = 审批时刻 + 72h；其它类型仍走 CR107 天数。
- 历史 Tab：已通过/部分通过且待付款可「中止申请」→ 申请 Cancelled、账单 cancelled，并同步缴费名单。

## Non-goals

- 已付款账单不做中止/退费。
- 不改 CR107 全局默认天数（仅重修出账走 72h）。
- 不恢复独立的 bypassCreditMin 勾选 UI（原位改造为超上限额度）。

## Capabilities

### New Capabilities

- `whitelist-credit-bypass-retake-abort`: 超分额度、重修 72h、审批中止

### Modified Capabilities

- （无）

## Impact

- `SupplementEntryDrawer.vue`、`supplementListQueue.js`、`addDropMultiItems.js`、选课闸门调用处
- `addDropApprovalQueue.js`、`registrationBatchFormUtils.js`（+hours）
- `AddDropApprovalView.vue`、`adminAddDropPaymentInsight.js` / `feeRosterQueue.js`
- i18n
