## Why

详情/审批费用预估把学期帽超出误当成计费，且把全部应收学分挂到一门加课上，漏计重修全额。规则应为：重修全部学分计费 + 加课仅毕业学分超出部分计费，合计展示；课程缴费须同源。

## What Changes

- 统一按行计费：`Retake` 全学分；`Add` 仅毕业 GE/ME 超出；合计 = 两部分之和。
- 详情/审批费用明细拆行展示；「毕业超出学分」只含加课计费学分。
- Demo enrich 停止用学期帽伪造单行费用；种子/enrich 产出正确 `feeEstimate`。
- 课程缴费待缴行按 `feeEstimate.items`（或等价两段规则）拆行同步。

## Non-goals

- 不改科类单价表、SST 税率。
- 不改退课是否计费（仍不计）。

## Capabilities

### New Capabilities

- `adddrop-fee-retake-plus-grad-excess`: 重修全额 + 加课毕业超出求和，详情/审批/缴费一致

### Modified Capabilities

- （无）

## Impact

- `addDropFeeRates.js`、`addDropScheduleDemo.js`、详情/表单展示、`studentCoursePaymentStore.js`、相关 demo 种子
