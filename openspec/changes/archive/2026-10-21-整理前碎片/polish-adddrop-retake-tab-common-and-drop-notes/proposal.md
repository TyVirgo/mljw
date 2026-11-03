## Why

重修区 Tab 与「本学期重修课程 / 费用」公共区视觉边界不清；费用明细框位置偏后；退课「原因」仍必填，需改为可选补充说明。

## What Changes

- 原课程 Tab 仅切换原课列表；本学期重修表、计费学分、预估费用、费用预估三行明细（加课/重修/SST）为 Tab 公共区并紧挨展示。
- 退课「退课原因」改为「补充说明」，非必填（去星号、去掉提交必填校验）。

## Non-goals

- 不改费用计算公式；不改为按课号逐行 fee items。
- 不改重修 addNotes 字段。

## Capabilities

### New Capabilities

- `adddrop-retake-tab-common-drop-notes`: 重修 Tab 公共区与退课补充说明

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`、`addDropFormSections.js` 校验、i18n zh/en；详情体随 i18n 标签更新
