## Decisions

1. `formatSupplementInviteCountdown` 返回 `remainingMs`；`label` 在传入 `t` 时用与缴费同源的 `formatRemainingDuration`（或同款 i18n key）。
2. 未发送 / 已逾期文案不变；逾期样式用 `is-overdue`。
3. 色阶阈值复用 `PAYMENT_REMIND_WITHIN_MS`（24h warn）与 `PAYMENT_URGENT_WITHIN_MS`（12h urgent）。
4. `SupplementListView` 增加 `nowTick` 定时刷新；单元格 `class` 对齐 `.pay-remain`。

## 兼容

学生端若消费 `cd.label`，升级为天时分格式后一并更清晰。
