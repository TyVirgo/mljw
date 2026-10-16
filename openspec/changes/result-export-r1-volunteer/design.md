## Context

`RegistrationResultView` 在课程维度·第一轮走 `showVolunteerToolbar`（发布/日志），与二/三轮、学生维度的 `showBulkToolbar`（删除/导出）分离。第一轮主表无勾选且有 rowspan。志愿抽屉 `PreselectVolunteerRosterDrawer` 已有勾选，只读时隐藏。

已有：`ExportModal`（currentPage / allResults / selectedRows）、`resultCourseExportFields` / `resultStudentExportFields`、`exportCourseRegistrationData`。当前结果页导出忽略 `exportScope`，始终导出全部筛选行。

## Goals / Non-Goals

- Goals：第一轮勾选+导出（明细默认 / 汇总）；抽屉学生导出；已有 Tab 导出尊重 scope。
- Non-Goals：改志愿算法、发布流程、后端 API。

## Decisions

1. **导出类型（方案 B）**  
   主表导出弹窗顶部增加「明细 | 汇总」单选，默认明细；字段列表随类型切换。一次导出一张 Sheet。

2. **勾选单位**  
   按主表行（课程 × `sectionId`）勾选；rowspan 列旁独立 checkbox 列，不参与合并。

3. **明细数据源**  
   对勾选/范围内的 courseId+sectionId，从 `getVolunteerSectionState` 取 volunteers，拼课程/批次元数据。字段：批次、课程代码/名称、分组、学号、姓名、专业、入学批、相对学期、提交时间、是否毕业生、是否选上（`selected`）。

4. **汇总数据源**  
   复用/扩展 `resultCourseExportFields` 与第一轮主表行（capacityLabel、selectedPercent、effective/senior、specialAdded 等）。

5. **抽屉导出**  
   仅明细；范围：当前页 / 全部过滤结果 / 已选学生。只读时显示勾选列与导出按钮，隐藏添加/批量移除。

6. **已有 Tab**  
   `handleExportConfirm` 按 `exportScope` 切片：selectedRows → selectedIds；currentPage → paginatedRows；allResults → rows。

## 影响文件

| 路径 | 变更 |
|------|------|
| `RegistrationResultView.vue` | R1 勾选、导出入口、类型、scope |
| `PreselectVolunteerRosterDrawer.vue` | 导出按钮、只读勾选、ExportModal |
| `courseRegistrationExportFields.js` | R1 明细/汇总字段 |
| `exportCourseRegistrationExcel.js` | format 行函数 |
| `preselectVolunteerConfirm.js` | 可选：`listVolunteerDetailRowsForSections` |
| `zh.js` / `en.js` | 导出类型文案 |

## Risks / Trade-offs

- rowspan + checkbox：需保证全选只作用于当前页可见行 id。
- 明细行量大：demo 可接受；字段默认精简。
- 导出类型 UI 若塞进 `ExportModal` 需 slot/prop；优先页面外层 radio + 传入对应 fields，避免改坏全局弹窗。

## Open Questions

- 无（探索已定：明细优先、汇总并存、按分组行、新 change）。
