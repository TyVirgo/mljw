## Why

选课结果·学生维与选课日志展示高度重叠；维护双入口增加学习成本。将日志关键字段并入学生维后，可屏蔽独立「选课日志」菜单。

## What Changes

- 选课结果·学生维新增列：操作人、操作时间、操作结果。
- 操作结果仅展示确认态：待分配、选课成功、选课失败、取消排队（不含「排队中」）。
- 学生维搜索对齐日志：批次、轮次、学号/姓名、课程代码/名称、操作人、操作结果、操作时间范围。
- 侧栏屏蔽 `cr-log`；课程维度 Tab 与日志统计卡不迁入。
- 方案 A：以结果行为主，补日志字段；demo 混入失败/取消排队样例。

## Non-goals

- 不搬迁日志页 7 个统计卡。
- 不改课程维度 Tab。
- 不接真实后端审计流。

## Capabilities

### New Capabilities

- `result-student-log-merge`: 结果学生维融合操作日志字段与搜索

### Modified Capabilities

- （无独立主规格变更）

## Impact

- `RegistrationResultView.vue`、`registrationResult.js`
- `courseRegistrationMenu.js`、`App.vue`、flowGuide、i18n、导出字段
