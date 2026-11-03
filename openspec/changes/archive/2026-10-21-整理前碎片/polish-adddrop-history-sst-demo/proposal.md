## Why

审批历史「账单明细」仅个别 demo 硬编码 SST，与学生缴费含税应付不一致；历史详情操作列会出现「待定」；列表把 AddDrop/RetakeDrop 折叠成加课/重修，且历史缺少联合申请 demo。

## What Changes

- 账单明细统一按申请 SST 补行，合计含税
- 历史/只读详情操作列仅展示：通过 / 不通过 / 驳回（无待定）
- 历史队列补充 AddDrop、RetakeDrop demo；列表类型标签不再折叠

## Capabilities

### New Capabilities

- `adddrop-history-sst-demo`: 审批历史账单 SST、行决策展示与联合类型 demo

### Modified Capabilities

- （无主规格增量；本变更以 delta 为准）

## Impact

- `adminAddDropPaymentInsight.js`、`AddDropBillDetailDrawer.vue`
- `AddDropApplicationDetailBody.vue`
- `addDropApprovalQueue.js`、`AddDropApprovalView.vue`
- i18n（若需类型/SST 文案微调）
