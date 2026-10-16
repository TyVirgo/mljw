## Why

教务需要按课程班维度查询已选学生名单并导出 Excel；现有「选课结果」为学生/课程汇总，字段与旧系统「课程班学生名单查询」及导出模板不一致。

## What Changes

- 新增菜单页「课程班学生名单查询」（`cr-section-roster`，挂在结果与日志下）。
- 搜索：学期、课程代码/课程班名称、学号或姓名、批次、负责人、专业、修读方式（不含学籍异动筛选项）。
- 列表列对齐图示1（含学籍异动列）；导出列对齐图示2（含名单ID/课程班ID/课程ID等）。
- 导出按钮工具栏左对齐 outline；demo 扁平名单数据。

## Non-goals

- 不做旧系统学号下拉选人组件（首版学号/姓名模糊）。
- 不复刻旧绿头皮肤；沿用本项目 cr-list-page。
- 不接真实后端。

## Capabilities

### New Capabilities

- `section-student-roster`: 课程班学生名单查询与导出

### Modified Capabilities

- （无）

## Impact

- `courseRegistrationMenu.js`、`App.vue`、i18n
- 新 `sectionStudentRoster.js`、`SectionStudentRosterView.vue`
- 导出字段与 `exportCourseRegistrationExcel.js`
