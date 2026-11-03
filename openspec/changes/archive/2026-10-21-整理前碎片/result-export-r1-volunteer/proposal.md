## Why

管理端选课结果「课程维度 · 第一轮」工具条仅有发布/发布日志，主表无勾选，无法批量导出选课结果；志愿名单抽屉勾选仅服务批量移除。教务需要按课程（×分组）批量导出汇总与学生明细，并在志愿名单内勾选学生导出明细。

## What Changes

- 第一轮主表增加勾选列（按课程×教学分组行）；志愿工具条增加「导出」。
- 导出弹窗支持类型：**明细**（默认，更重要）与**汇总**；范围复用 `ExportModal`（当前页 / 全部 / 已选行）。
- 明细：展开为「学生 × 课 × 分组」行（含是否选上等志愿字段）。
- 汇总：对齐主表课程×分组一行（容量、已选% 等）。
- 志愿名单抽屉：工具行增加「导出」；只读时仍保留勾选列以便导出（移除仍禁用）。
- 顺带：学生维度 / 第二三轮已有导出走通 `exportScope` 与「已选行」。

## Non-goals

- 不改发布/定稿/志愿添加移除业务规则。
- 不导出 PDF；不新增服务端接口（仍为前端 xlsx demo）。
- 不改学生端「我的选课结果」。

## Capabilities

### New Capabilities

- `result-r1-export`: 选课结果第一轮主表与志愿名单的明细/汇总导出

### Modified Capabilities

- （无主库 `openspec/specs/` 对应能力；行为增量落在本 change delta）

## Impact

- `RegistrationResultView.vue`、`PreselectVolunteerRosterDrawer.vue`
- `courseRegistrationExportFields.js`、`exportCourseRegistrationExcel.js`
- `preselectVolunteerConfirm.js`（展开明细数据辅助）
- i18n `zh.js` / `en.js`
- 复用 `ExportModal.vue`
