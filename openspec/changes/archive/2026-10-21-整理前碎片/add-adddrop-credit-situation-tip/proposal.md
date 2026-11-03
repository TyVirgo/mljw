## Why

加退课申请「学分要求」下缺少培养方案向的学分情况提示；学生选加课/加退课时不清楚是否已修满或还缺多少毕业学分；审批详情侧也需同源可见。

## What Changes

- 学分要求条下方增加学分情况描述（提示底色样式）
- 数字按学分要求条列汇总：毕业 GE/ME 未修 = 要求 − 已选；必修未修取条内同源毕业必修字段（不新增表格列）
- 有缺学分：`根据programme study plan，你目前毕业累计未修学分：必修课：x学分；GE：X学分，ME：X学分；`
- 无缺学分：`根据programme study plan，你目前均修满学分，无可选课程。`
- 加课、加退课、退课、重修凡展示学分要求条处均展示 tip；专名 `programme study plan` 保持英文
- 申请表、审批/详情、加/退/重修选课弹框同源；**固定提示语文案不变**，仅缺学分数字（必修/GE/ME）随条（勾选）动态变化
- 选课弹框学分条展示覆盖 `Add|AddDrop|Drop|Retake|RetakeDrop`（含重修关联退课）
- demo 默认展示缺学分情形

## Non-goals

- 不改学分要求七列布局与其它样式
- 不改 tip 固定文案措辞（含 `programme study plan`）

## Capabilities

### New Capabilities

- `adddrop-credit-situation-tip`: 学分要求下学分情况提示

### Modified Capabilities

- （无）

## Impact

- `addDropMultiItems.js`（gap 汇总）、`AddDropTermCreditStrip.vue`
- 基线含毕业必修已选/要求（不展示新列）
- i18n zh/en；详情/审批随 strip 组件带出
