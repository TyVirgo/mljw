## Why

重修原课程表「课程类型」放在首列、操作列左对齐，与同页退课/加课明细表习惯不一致，需小幅对齐布局。

## What Changes

- 原课程表列序改为：代码 → 名称 → 学年学期/成绩 → 课程类型 → 操作。
- 操作列（表头与单元格）右对齐。
- 列宽/样式继续沿用 `.lines-table`，与同页其他明细表一致。

## Non-goals

- 不改外层 Tab、成绩多行逻辑、选课弹框行为。

## Capabilities

### New Capabilities

- `adddrop-retake-original-table-columns`: 原课程表列序与操作列对齐

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`（原课程表 template + CSS）
