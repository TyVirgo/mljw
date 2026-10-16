## Why

学生课程缴费页金额仅为「学分×单价」，未展示 SST；加退选已有 6% SST 规则，缴费页应对齐并让 demo 行明显看出「课程费 + SST = 应付」。

## What Changes

- 缴费行拆分 `feeAmount` / `sstAmount` / `amount`（应付=课程费+SST）。
- Demo 待缴行按 China 计税（便于展示 SST>0）；列表与结算明细明示三档金额。
- 复用 `computeSstAmount` / `SST_RATE`；订单合计用含税 `amount`。

## Non-goals

- 不改支付码交互与 TTL。
- 不强制改当前生全局类别为 China（仅缴费 demo 计税策略）。

## Capabilities

### New Capabilities

- `student-payment-sst-demo`: 学生课程缴费 SST 展示与 demo

### Modified Capabilities

- （无）

## Impact

- `studentCoursePaymentStore.js`、`StudentCoursePaymentView.vue`、zh/en i18n
