## Decisions

1. 全选启用条件：`selectAllCandidates.length > 0`（含已勾选以便取消全选）。
2. 同课同分组键：`courseId|code + sectionId|code`；AddDrop 禁止重叠；RetakeDrop 不禁。
3. 审批表 `table-layout: fixed` + 教师/名额 ellipsis + `min-width` 横滚。
