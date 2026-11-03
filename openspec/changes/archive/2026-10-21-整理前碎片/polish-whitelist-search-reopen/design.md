## Decisions

1. **提示**：单段 `doorHint`；`inviteHint` 并入或置空不渲染第二段。
2. **搜索常驻**：专业、入学批次下拉、学号、姓名；操作：查询 / 重置 / 收起|更多。
3. **展开行**：权限下拉（既有 permission keys）、生效状态（`all` / `notSent` / `active` / `expired`）。
4. **filter**：扩展 `filterSupplementList`：intake、studentId、studentName、doorStatus；保留 permission；keyword 兼容旧调用。
5. **再次开放**：逻辑不变；modal/按钮文案强调「延期开放并发送通知」。
6. **布局**：复用 `list-page-search.css` + `searchExpanded`（对齐 FeeRoster/审批）。

## 影响文件

见 proposal Impact。
