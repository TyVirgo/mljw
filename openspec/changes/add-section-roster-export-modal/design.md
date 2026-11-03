## 决策

1. 复用 `ExportModal`，对齐监控/缴费名单：`selectedFields` + `exportScope`
2. `currentPage` → `paginatedRows`；`allResults` → 当前筛选 `rows`
3. `hasSelectedRows=false`；选「选中行」时沿用弹框 toast
4. 确认后按 `selectedFields` 过滤 `sectionStudentRosterExportFields` 再导出

## 风险

- [用户习惯全字段一键导出] → 弹框默认字段全在「已选」侧（ExportModal 默认行为）
