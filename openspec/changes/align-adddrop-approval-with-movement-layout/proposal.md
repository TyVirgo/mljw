# 提案：加退课审批页对齐学籍异动审批布局

## Why

加退课/重修审批与学籍异动审批同属「待办 / 已提交 / 历史」范式，但前者 Tab 文案、搜索维度与版式细节与学籍不一致。

> **拆分说明**：详情流程图、审批内容弹窗、勾选批量审批已拆至  
> `align-adddrop-approval-flow-with-movement`。本包仅保留列表壳对齐。

## What Changes

1. **Tab**：待办文案对齐为「待我审批」。
2. **搜索区**：补充学号、姓名分栏等。
3. **版式**：间距/表头向学籍审批靠拢。

## Non-goals

- 详情 Timeline / 审批弹窗 / 批量勾选 → 见 `align-adddrop-approval-flow-with-movement`
- 不改学籍异动审批页

## Capabilities

### Modified Capabilities

- `course-reg-approval`：加退课审批列表壳对齐

## Impact

- `AddDropApprovalView.vue` 搜索与 Tab 文案、i18n
