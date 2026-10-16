## Decisions

1. **canRemindPayment**：去掉剩余 &lt; 24h / overdue 门槛；保留 Approved | PartiallyApproved + billStatus pending。24h 醒目样式仍由 `getPaymentRemainingInfo` 的 urgent/warn 控制，与按钮解耦。
2. **defaultRegenDueAt**：默认参数改为 3；弹窗 `defaultRegenDueAt(3)`。不改首次账单宽限期种子（除非另开需求）。
3. **重新生成订单**：仍仅超时且 Approved 可点（既有 `canRegeneratePaymentOrder` 不变）。
