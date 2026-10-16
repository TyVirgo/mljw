## Why

审批通过后「发送邮件次数」被默认写成 1，与「仅点击发送才计数」不符；通过后待缴课程未可靠同步到学生「课程缴费」待缴费列表（灌种一次性，之后再审批不合并）。

## What Changes

- 生成待缴账单时 `paymentRemindCount` 默认为 0；每次发送邮件提醒 +1
- 保留课程缴费既有 demo 待缴行；将当前学生已通过/部分通过且待缴的申请课行增量并入待缴费
- 审批通过写账单后、进入课程缴费页时均可触发合并（不依赖首次灌种）

## Capabilities

### New Capabilities

- `adddrop-remind-zero-sync-payment`: 催缴计数从零起 + 待缴同步课程缴费

## Impact

- `addDropApprovalQueue.js`、`studentCoursePaymentStore.js`、`StudentCoursePaymentView.vue`（若需显式 merge）
