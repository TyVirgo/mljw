# 变更：polish-register-list-column-order

## Why

学生在线选课主表列序不利于先认课再认组，容量也不靠近操作；GE 未展示校选类别，ME demo 文商理混杂与「按学生过滤后应同一类」的演示不符。

## What Changes

- GE / ME 同步列序：课程名称后为课程分组；校选类别在学分前；容量列紧挨操作前。
- GE 与 ME 均展示校选类别（文/商/理）。
- Demo：ME 校选类别统一为同一类（文科）；GE 可混杂。

## Non-goals

- 不实现真实按学生校选过滤引擎（本轮仅 demo 数据呈现）。
- 不改管理端可选课程列表列序（除非同页复用）。

## Capabilities

### Modified Capabilities

- `course-registration`：学生在线选课主表列序与校选类别展示

## Impact

- `StudentRegisterView.vue`
- `selectableCourses.js` demo / resolve
- 可选：`StudentCourseCatalogDrawer.vue`
