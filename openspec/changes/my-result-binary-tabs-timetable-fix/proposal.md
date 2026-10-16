## Why

「我的课程」课表把申请加课与在线选课中签课叠在同一时段（如 SE201 与 COMP3192 同为周三 14–16），演示不合理。同时「申请和添加课程」Tab 按获取渠道分类，与列表「课程类别」（必修/GE/ME）脱节；课表三色图例加重理解成本。应改为按课性二分，并令申请课时段对齐课库分组（与在线选课同源）。

## What Changes

- 去掉「申请和添加课程」Tab；仅保留 **全部 / 选修课 / 必修课**。申请加课/重修、管理员代选按统一课程类别归入必修或选修。
- 「我的课表」改为 **必修 / 选修** 两色；更新图例与页头说明。
- 调整 demo：已批 COMP3192 改用课库不冲突分组（**sec 03 Mon 08–10**），避免与 SE201（Wed 14–16）及 CST201（Thu 10–12）冲突。

## Non-goals

- 不做课表拖拽改时间 UI。
- 不删除加退选申请数据源。
- 不改在线选课页图例（仍可为三层：必修/已确认/本轮）。

## Capabilities

### New Capabilities

- `my-result-binary-classify`: 我的课程二分 Tab + 课表两色 + demo 时段消冲突

### Modified Capabilities

- （无）

## Impact

- `studentMyResultCourses.js`、`WeekScheduleGrid.vue`、`StudentMyResultView` 文案
- `studentDemoSeed.js` / `addDropApprovalQueue.js` 中 COMP3192 时段
- i18n zh/en
