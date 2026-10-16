## Why

审批弹框缺少「学分要求」条，老师逐行通过/驳回时无法预览学分变化；学生申请端已有同源动态条，审批应对齐。

## What Changes

- 单条审批弹框顶部增加 `AddDropTermCreditStrip`
- 默认（行未通过）展示申请前基线；仅「通过」行计入加减；全通过时与学生提交时学分条一致
- 学生提交时持久化 `termCreditStripBaseline`；缺省时可由已存 strip 反推基线

## Capabilities

### New Capabilities

- `adddrop-approval-credit-strip`: 审批弹框动态学分要求

## Impact

- `AddDropApprovalModal.vue`、`addDropMultiItems.js`、`addDropFormSections.js` / `StudentAddDropView.vue`、`addDropApprovalQueue.js`（创建申请字段）
