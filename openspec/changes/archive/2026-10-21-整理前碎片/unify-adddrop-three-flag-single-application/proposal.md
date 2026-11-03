## Why

学生需在同一申请单号内完成加课/退课/重修任意组合，学分一次投影，避免拆单后二次申请叠未审底账的不确定。学生端不再选「申请类型」下拉，改为三个是否；详情与审批仍展示申请类型（按勾选填充）。

## What Changes

- 学生申请弹框：去掉申请类型下拉；「是否退课 / 是否加课 / 是否重修」三选是/否；是则展开对应分区，否则隐藏。
- 允许只加、只退、只重修或任意组合；至少勾一个「是」方可提交。
- 同一单号提交：items 可同时含 Drop / Add / Retake；学分条对本单全部行同步投影。
- 详情、审批、列表的「申请类型」按勾选结果展示（如 退课+加课+重修），字段保留。
- 二次申请：有真实未审单则整单禁再交（非同主类型互斥）；可查看、可取消后重发。
- 新增组合 type：`AddRetake`、`AddDropRetake`；重修行使用独立 `retakeLines`，避免与加课抢 `addLines`。

## Non-goals

- 不改审批流引擎、缴费主流程。
- 不删除历史 demo 单；展示上可用 items/flags 回推类型文案。

## Capabilities

### New Capabilities

- `adddrop-three-flag-single-application`: 三是否合一单 + 类型展示与整单二次限制

### Modified Capabilities

- （无）

## Impact

- `addDropFormSections.js` / `addDropTypeDisplay.js` / `addDropMultiItems.js`
- `AddDropApplicationFormSections.vue` / `StudentAddDropView.vue`
- 详情/审批类型展示组件
- i18n zh/en
