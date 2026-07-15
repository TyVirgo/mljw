## 背景与动机

异动审批列表「申请次序」右侧恢复 **最近审核时间**。待我审批中不应大量为 `—`：该字段表示 **当前审批人前一逻辑节点** 的操作时间；前一节点若为会签多分支，取各分支中最新操作时间。

## 变更内容

- 列表列 + 导出字段「最近审核时间」
- `resolveLastApprovalActionTime` 按「前一逻辑节点」解析（首节点取 Submitted；会签组取 max）
- workflow 声明会签分组 `parallelGroup`（v1 串行推进下的逻辑组）
- 更新 columnHints 文案

## 能力范围

### 修改的能力

- `movement-approval-app`：最近审核时间语义与展示

## 影响范围

- `MovementApprovalView.vue`
- `movementApprovalQueue.js`、`movementApprovalWorkflows.js`
- `movementApprovalLogDisplay.js`
- `movementApprovalExportFields.js`、`exportMovementApprovalExcel.js`
- i18n `movementApproval.columnHints.lastActionTime`

## 非目标

- 不实现真正并行推进 UI（仍 v1 串行审批）
- 不改审批详情/日志抽屉结构
