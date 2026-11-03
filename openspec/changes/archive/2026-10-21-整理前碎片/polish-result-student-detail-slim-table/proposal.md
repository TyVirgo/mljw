## Why

选课结果「学生维度」列过多且右侧冻多列，出现横向滚动，扫名单与对结果不便；代选已写入的原因/附件未在界面暴露。

## What Changes

- 学生维主表仅保留必要列：勾选、序号、学号、姓名、课程代码、课程名称、操作结果、详情
- 学号/姓名左冻；操作结果右冻；去掉原多列右冻与横向滚动依赖
- 行末「详情」打开只读抽屉：专业、入学批次、批次、学分、类型、课程分组、来源、志愿、操作人、时间，以及原因、附件
- 导出仍含全量字段，并补充原因、附件名

## Non-goals

- 不改学生维搜索条件与删除/代选流程
- 不在详情内编辑原因/附件
- 不改课程维度表

## Capabilities

### New Capabilities

- `result-student-detail-slim-table`: 学生维瘦表 + 详情抽屉（原因/附件）

### Modified Capabilities

- （无）

## Impact

- `RegistrationResultView.vue`
- 新建 `ResultStudentDetailDrawer.vue`
- `courseRegistrationExportFields.js` / `exportCourseRegistrationExcel.js`
- `zh.js` / `en.js`
