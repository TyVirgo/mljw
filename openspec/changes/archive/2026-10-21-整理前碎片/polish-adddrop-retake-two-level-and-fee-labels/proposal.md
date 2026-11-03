## Why

重修选课扁平展示看不清挂科原课；最近成绩列冗余；加课/重修区 SST 与预估费用口径混杂。

## What Changes

- 重修两层：先列出挂科/可提升原课（三类 Tab 仍在弹框候选侧），原课行操作「选择重修课程」打开仅含该课允许重修目标的选课弹框。
- 表单/详情重修表去掉「最近成绩」列。
- 加课区、重修区去掉 SST 字段；加课「预估费用」→「加课预估费用」（仅加课）；重修「预估费用」→「重修预估费用」（仅重修）；「重修总学分」→「重修总学分（计费）」。
- 唯一费用预估块展示：加课费用 / 重修费用 / SST（SST 旁保留原 ? tip）+ 合计。

## Non-goals

- 不改重修匹配/替代课算法本身。

## Capabilities

### New Capabilities

- `adddrop-retake-two-level-fee-labels`: 重修两层选课与费用字段文案

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`、`StudentAddDropView.vue`、详情体、i18n、可选 `retakeSubstitutePool` 辅助过滤
