# Design

## Decisions

1. **2×2 费用行**  
   表单用 `fields-row-2`（`repeat(2, 1fr)`）；详情费用去掉 `field-grid--single`，用默认两列 `field-grid`。

2. **催缴次数**  
   字段 `paymentRemindCount`（number）。审批通过且 `generateBill` 且费用>0 时置为 `Math.max(1, existing)`。再次发送邮件提醒 `+1`。历史列插在 `bill` 与 `paymentRemaining` 之间。

3. **账单 demo**  
   在 `ensureHistoryPaymentDueDemo` / payment store 种子中补：多课待缴、部分已缴、已缴清、含 SST 分项展示（明细合计用 payable）。

4. **行级审批**  
   详情仍通过 `AddDropApprovalModal` 操作（不嵌详情正文）；详情课程表增加只读「行决策」列。打开弹窗前若 `items` 空则从申请分节/快照补齐（`ensureApplicationItems`）。
