# 加退审批布局、账单明细、催缴次数与行级回显

## Why

审批/详情费用字段需统一两列排布；历史账单明细 demo 偏少；催缴缺少「发送邮件次数」；详情审批须与主表单条审批一样能逐课同意/拒绝，并回显行决策。

## What Changes

1. **两列布局**：加课/重修表单学分费用区由一行四列改为 2×2；详情费用区由单列改为两列。
2. **账单明细**：补充多门待缴、部分已缴、全缴、超时、含 SST 等 demo 场景。
3. **发送邮件次数**：历史列表在账单与缴费剩余时间之间增加列；审批通过且需缴费时默认计 1 次；再次催缴递增（对齐白名单通知次数）。
4. **详情审批对齐主表**：详情「审批」打开与主表单条相同的逐课同意/拒绝弹窗；详情课程表回显行决策；保证 `items` 齐全。

## Capabilities

### New Capabilities

- `adddrop-approval-payment-remind`：审批缴费催缴次数与默认发信

### Modified Capabilities

- `course-reg-approval`：详情/表单两列、账单明细、行级决策回显

## Impact

- `AddDropApplicationFormSections`、`AddDropApplicationDetailBody`
- `AddDropBillDetailDrawer`、`adminAddDropPaymentInsight`、审批 queue demo
- `AddDropApprovalView` 历史列、`approveAddDropApplication`、催缴确认
- `AddDropApprovalModal` / `AddDropApprovalDetailDrawer`
