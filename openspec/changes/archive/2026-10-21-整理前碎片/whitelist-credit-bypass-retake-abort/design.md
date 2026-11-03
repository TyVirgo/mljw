## Decisions

1. **UI**：原 `bypassCreditMin` 勾选位改为「允许突破本学期学分要求」勾选 + `creditBypassExtra` 数字（1–3，默认 3）；保存为 `bypassCreditMax` + `extraCredits`。
2. **闸门**：`evaluateTermCreditGate` 增加 `creditBypassExtra`；`blocked = over && (!bypass || excess > extra)`；`extra` 缺省且 bypass 时按 3。
3. **72h**：申请含已通过 Retake 行且出账时，`paymentDueAt = now + 72h`；`paymentGraceHours=72`；否则仍 `getPaymentGraceDays()` + `addDaysToDateTime`。
4. **中止**：`canAbortApprovedAddDropBill`：`Approved|PartiallyApproved` + `billStatus=pending`；`abortApprovedAddDropApplication` 置 Cancelled + cancelled，写日志，fee roster 同行 `paid` 未缴则标取消/移除或 paid 标记。
5. **已付款**：不可中止。

## 影响文件

见 proposal Impact。
