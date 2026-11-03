## Why

加退申请中拟退的本学期必修未进入加课选课池，无法「退了再加回」；换组锁文案缺少白名单说明 tip。

## What Changes

- 加课（含加退选加）选课池 = 原资格种子 ∪ 本单拟退必修（按课库展开分组，原组取自拟退行）。
- 本学期退了再加回：仅原组可选（既有换组锁）；其它组展示锁文案，后附「？」说明白名单换组。
- 可选组仍受课表冲突校验（拟退后基线）；不改冲突算法。

## Non-goals

- 不改纯加课（无拟退）时把课表在读必修整表并入加课池。
- 不改换组锁红文案主句（仍用 coreMustSameSectionReadd）。

## Capabilities

### New Capabilities

- `adddrop-add-pool-drop-cores-lock-tip`: 拟退必修并入加课池 + 换组锁 tip

### Modified Capabilities

- （无）

## Impact

- `addDropEligibleCourses.js`（或 View 合并）
- `StudentAddDropView.vue` courseOptions
- `AddDropCoursePickerModal.vue` + i18n
