## Why

选课日志与选课结果「学生维度」在学号/姓名/课程上高度重叠，但日志缺少专业、入学批次、是否重修等学籍与选课意图字段，教务排查时仍需对照结果页。在不合并两页的前提下，补齐日志展示与导出字段即可降低来回切换成本。

## What Changes

- 选课日志行数据补充：`programme`（专业）、`intake`（入学批次）、`isRetake`（是否重修）
- 管理端「选课日志」表格在姓名后展示专业、入学批次；在课程类型后展示是否重修
- 导出字段与导出行格式同步上述三列；入学批次展示/导出使用既有 `formatIntakeBatch`
- demo 种子数据为各日志学生补齐学籍字段，并覆盖部分 `isRetake: true` 行

## Non-goals

- 不合并「选课结果·学生维度」与「选课日志」
- 不在日志页增加代选/删除等写操作
- 不新增专业/重修筛选条件（本变更仅展示与导出）
- 不把「课程来源」搬入日志

## Capabilities

### New Capabilities

- `registration-log-student-fields`: 选课日志展示与导出学籍画像字段（专业、入学批次、是否重修）

### Modified Capabilities

- （无既有 main spec 需 delta；本能力为新增）

## Impact

- `src/data/courseRegistration/registrationLog.js` — demo 学生与 `log()` 组装
- `src/views/courseRegistration/RegistrationLogView.vue` — 表列
- `src/data/courseRegistration/courseRegistrationExportFields.js` — 导出字段定义
- `src/utils/exportCourseRegistrationExcel.js` — `formatRegistrationLogExportRow`
- 复用 i18n：`courseRegistration.monitor.programme` / `intake`、`courseRegistration.student.isRetake`
