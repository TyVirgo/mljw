# 变更：polish-my-result-schedule-no-conflict

## Why

「我的选课」课表预览展示在线选课已确认课（含 R1 公示中签）。演示数据中 IT102（Mon 09–11）与 AI110 sec-01（Mon 10–12）重叠，终态课表出现并排冲突块。选上的课在业务上不应冲突，需把演示时段错开。

## What Changes

- 将演示确认集中与 IT102 冲突的 **AI110** 班次时段挪到整周空档（避开确认选修 + 必修底图）。
- 课库同源班次时间一并调整，保证志愿中签同步后课表无重叠。
- 不改课表组件、不改「我的选课」筛选口径。

## Non-goals

- 不移除课表中的培养方案必修底图
- 不改冲突检测/分 lane 算法（在线选课预览仍可展示冲突）
- 不加退课/重修演示数据大改（除非硬编码了同一 AI110 时段且必须同步）

## Capabilities

### New Capabilities

- `my-result-schedule-no-conflict`：我的选课终态演示课表无时段重叠

### Modified Capabilities

- （无）

## Impact

- `src/data/courseRegistration/selectableCourses.js`（AI110 班次时段）
- 若种子硬编码 AI110 时间：`studentVolunteerSheet.js` / `studentDemoSeed.js`（按需）
- OpenSpec 本 change
