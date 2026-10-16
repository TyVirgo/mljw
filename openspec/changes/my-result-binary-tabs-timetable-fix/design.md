## Context

- `listMyResultCourses` 合并必修、确认选修、已批申请；`resultType` 含 application/admin。
- 课表 `resolveMyResultScheduleLayer` 三色；已有 `resolveBinaryScheduleLayer` 可复用。
- 课库：SE201-01 与 COMP3192-01 同为 Wed 14–16；COMP3192-02 为 Thu 10–12。

## Decisions

1. **归类**：`resolveUnifiedCourseCategoryCode` → `required` 则 Tab/着色为必修，否则选修（含 GE/ME 申请课）。保留 `sourceType` 供溯源，但 `resultType` 仅 `required|elective`。
2. **Tab**：`MY_RESULT_TYPE_TABS = ['all','elective','required']`；删除 other 过滤。
3. **课表**：`buildMyResultSchedule` 使用 `resolveBinaryScheduleLayer`；`legendMode=myResult` 仅两色。
4. **消冲突**：已批申请 COMP3192 用课库 **sec03** `Mon 08:00–10:00`（sec01 撞 SE201、sec02 撞 CST201、sec04 撞 MATH201、sec05 撞 BUS201）。重种条件：Add 行仍为 Wed 14 / Thu 10 则强制刷新。

## Risks

- 旧 localStorage 仍含 Wed 14–16 / Thu 10–12 申请行 → 依赖 reseed 条件强制刷新。
