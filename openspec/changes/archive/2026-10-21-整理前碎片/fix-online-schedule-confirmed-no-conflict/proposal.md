## Why

在线选课 R2「我的课表预览」中，两门已确认选修（COMP101 与 R1 公示中签 COMP201）同落周五 10–12，实线并排显示为冲突。业务上：已确认课互不冲突；R1 本轮志愿不得与必修实线冲突（冲突须置灰提交并提示）。演示种子与 R1「确认志愿顺序」闸门需对齐该规则。

## What Changes

- 调整演示数据：R1 中签 COMP201 班次/时段与确认半池、必修底图错开，使 R2/终态课表实线层无重叠。
- 强化 R1「确认志愿顺序」：待分配中若任一门与必修硬冲突，确认按钮置灰并提示（行级加入志愿硬闸已有，一并验收）。
- 保留 R1 志愿之间的软冲突（可保留、调序，不挡确认志愿顺序）。

## Non-goals

- 不改 WeekScheduleGrid 的 lane/并排算法（靠数据与闸门保证实线不撞）。
- 不改 R2/R3 抢课提交硬冲突基线逻辑（已含必修+已确认）。
- 不移除加退课选课器里「COMP201 01/02 撞确认表」的故意冲突样例（仅保证中签班次不进冲突槽）。

## Capabilities

### New Capabilities

- `online-schedule-confirmed-integrity`：在线选课课表预览中，已确认/必修实线互不重叠；R1 本轮对必修硬挡

### Modified Capabilities

- （无）

## Impact

- `src/data/courseRegistration/studentVolunteerSheet.js`（中签班次）
- `src/data/courseRegistration/selectableCourses.js`（若需同步班次时段注释）
- `src/data/courseRegistration/studentRegistrationScheduleConflict.js` / `studentRegistrationStore.js`（确认志愿硬闸）
- `src/components/courseRegistration/StudentRegistrationCartDrawer.vue`（确认按钮 disabled + 提示）
- i18n（若新增确认序硬冲突提示键）
- OpenSpec 本 change
