## Why

审批历史表头在收紧列宽后出现中文「一字一行」竖排；缴费名单经学生缴费同步后会出现仅有学号、姓名/专业/入学批次为空的脏行。

## What Changes

- 审批 sticky 表头：禁止单字竖排，允许最多约 1–2 行可读换行；为紧凑列设合理 `min-width`
- 缴费名单：同步写入补全姓名/专业/批次；缺字段时回填；聚合展示过滤无姓名的不合理行

## Non-goals

- 不改缴费计费/聚合学分公式
- 不改审批业务列集合与操作按钮

## Capabilities

### New Capabilities

- `approval-header-wrap-fee-roster-hygiene`: 表头换行约束 + 缴费名单身份字段卫生

### Modified Capabilities

- （无）

## Impact

- `AddDropApprovalView.vue`（表头/列宽 CSS）
- `studentCoursePaymentStore.js`（`collectLiveUnpaidLines` 补字段）
- `feeRosterQueue.js`（upsert 回填 + 聚合过滤）
