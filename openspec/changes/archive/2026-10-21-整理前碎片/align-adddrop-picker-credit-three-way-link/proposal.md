## Why

加课/退课/重修已同单，但选课弹框学分条与学期帽仍按「本侧勾选 + 拟退」投影，漏掉另一侧（加↔重修）表单已选，三方未整体联动。

## What Changes

- 弹框学分投影：任意时刻 = 基线 − 全部拟退 + 全部拟加 + 全部拟重修（本侧用勾选替换表单同侧，避免双计）。
- 学期帽 / GE 帽判定同样纳入另一侧表单行。
- `termCreditGate` 拆分 `addOnlyLines` / `retakeLines`（保留合并 `addLines` 兼容）。

## Non-goals

- 不改重修与加课同等计入学期总学分帽的规则。
- 不做按操作时间线的严格回放，只保证当前三列表实时净值投影。

## Capabilities

### New Capabilities

- `adddrop-picker-credit-three-way`: 选课弹框加/退/重修学分三方联动

### Modified Capabilities

- （无）

## Impact

- `StudentAddDropView.vue`（gate 字段）、`AddDropCoursePickerModal.vue`
