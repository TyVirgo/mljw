## Why

重修汇总表标题仍写「本学期重修课程」，且「曾修课程成绩」与上方原课列表重复；费用预估只显示三项合计，无法看出逐课计费过程。

## What Changes

- 汇总表标签改为「选择的重修课程」。
- 「曾修课程成绩」列改为「重修原课程」，单元格为原不及格课 `课程代码/课程名称`（如 `MATH101/Calculus I`）。
- 费用预估加课/重修/SST 展示详细计费过程：逐课行参考 `课号 · 科类 · 应收 n 学分 × 单价 = 金额`；SST 有税时用「课程费合计 × 税率 = 税额」。

## Non-goals

- 不改计费公式与 `feeEstimate.items` 生成逻辑。
- 不改原课 Tab 内成绩列。
- 不改缴费页订单行文案（仅申请表/详情费用框）。

## Capabilities

### New Capabilities

- `adddrop-retake-original-col-fee-detail`: 重修原课程列与费用预估明细过程

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`、`AddDropApplicationDetailBody.vue`、i18n zh/en
