## Context

`FeeRosterView.handleExport` 现调用 `exportMultiSheetExcel` 一次写出学生汇总 + 课程明细，无 `ExportModal`、无勾选。选课结果第一轮已用 `ExportModal` 的 `modes`（明细/汇总）+ `exportScope`。

## Decisions

1. **弹框**：复用 `ExportModal`；`modes` = 明细 / 汇总，默认明细。
2. **字段**：明细 → `feeRosterCourseExportFields`；汇总 → `feeRosterStudentExportFields`。
3. **范围**：currentPage / allResults / selectedRows；主表勾选学生（`studentId`，必要时拼 `isPaid` 区分同生多行）。
4. **明细切片**：先按 scope 得到学生集合，再从 `filteredDetails` 取这些学生的课程行。
5. **取消**默认双 Sheet；若未来需要可再加「两页都要」mode。

## 影响文件

- `FeeRosterView.vue`：勾选、ExportModal、handleExportConfirm
- i18n：复用 `courseRegistration.result.exportDetail/Summary` 即可

## Risks

- 学生表可能同一学号因已缴/未缴拆行；勾选 key 用 `${studentId}-${isPaid}` 与表格 key 一致，明细展开时按 studentId（或精确行）过滤——优先按勾选行的 studentId 集合展开课程（同生两行都勾则课程仍一份）。
