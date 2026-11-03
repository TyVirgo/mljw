## Why

「全部课程结果」下「我的课表」需汇总多类型选课结果，并以四色区分必修 / 选修 / 申请 / 管理员，配套图例与说明。

## What Changes

- 我的选课课表按 `resultType` 四色着色（不再把申请/管理员并入选修色）。
- `legendMode=myResult` 图例展示四项：必修、选修、申请、管理员添加。
- 全部 Tab 副标题说明四色；类型 Tab 仍按当前类型过滤。
- 监控等场景仍可走二进制着色（`resolveBinaryScheduleLayer` / `normalizeBinaryScheduleSlots`）。

## Non-goals

- 不改列表 Tab 数据源与去重优先级。
- 不引入本轮志愿虚线图层。

## Capabilities

### New Capabilities

- `my-result-all-schedule-binary`: 全部课表多类型 + 四色图例（沿用既有 change 目录）

### Modified Capabilities

- （无）

## Impact

- `studentMyResultCourses.js`、`WeekScheduleGrid.vue`、`StudentMyResultView.vue`、zh/en i18n
