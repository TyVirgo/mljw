## Why

本学期重修汇总区应对三类 Tab 选出的重修课做全量展示与计费；当前确认选课时用新选择整表覆盖 `retakeLines`，导致换原课/换 Tab 再选时冲掉其它类已选重修课。

## What Changes

- 重修选课确认：按当前原课合并写入 `retakeLines`（保留其它原课已选行），汇总表/学分/费用始终统计全部重修课。
- 汇总区文案标明：展示的是各类原课对应选出的本学期重修课，而非原课列表。

## Non-goals

- 不改原课程 Tab 过滤逻辑。
- 不改计费公式本身。

## Capabilities

### New Capabilities

- `adddrop-retake-lines-cross-tab-summary`: 跨 Tab 重修行合并与汇总文案

### Modified Capabilities

- （无）

## Impact

- `StudentAddDropView.vue`（handleCoursePicked 合并）、i18n、可选表单 hint
