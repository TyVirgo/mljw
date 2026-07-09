## 背景与动机

产品图示要求异动审批列表移除 **最近审核时间**（Last Action Time）列，该列在待办/历史 Tab 中多数显示 `—`，信息价值低且占用横向空间。

## 变更内容

- `MovementApprovalView` 表格移除「最近审核时间」列（表头 tooltip 与数据单元格）
- 审批列表 Excel 导出移除 `lastApprovalActionTime` 字段
- 队列不再衍生 `lastApprovalActionTime`；删除 `resolveLastApprovalActionTime` 辅助函数

## 能力范围

### 修改的能力

- `movement-approval-app`：列表列定义（保留申请次数，移除最近审核时间）

## 影响范围

- `MovementApprovalView.vue`
- `movementApprovalQueue.js`
- `movementApprovalExportFields.js`、`exportMovementApprovalExcel.js`
- `movementApprovalLogDisplay.js`

## 非目标

- 不移除「申请次数」列
- 不改审批日志详情或流程图展示
