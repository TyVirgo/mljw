## Why

审批历史中已生成待缴账单、剩余时间仍大于 24 小时的行看不到「发送邮件提醒」；重新生成订单弹窗默认只延期 2 天，与业务期望的 3 天不一致。

## What Changes

- 历史 Tab：通过/部分通过且待缴时即可「发送邮件提醒」（不再要求剩余 &lt; 24h）
- 「重新生成订单」弹窗默认截止改为当前时刻 + 3 天（仍可手改）
- 覆盖旧规格中「仅不足 24 小时可催缴」的口径

## Capabilities

### New Capabilities

- `adddrop-history-remind-regen-3d`: 历史催缴可见性 + 重开订单默认 3 天

## Impact

- `adminAddDropPaymentInsight.js`、`AddDropOrderRegenModal.vue`
