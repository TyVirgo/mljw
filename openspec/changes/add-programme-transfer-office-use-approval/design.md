# 设计
- 标签复用 `newProgrammeFirst`、`startSemester`；日期用 `adminApprovalDate`
- 下拉：`programmeOptions`、`semesterOptions`（与 Section II 一致）
- 默认：`resolveProgrammeTransferOfficeUseDefaults(item)`
- 可见：学生 mode 隐藏；approve 可编辑；非 student 且已批准只读

## 布局与样式

- 组件根节点使用 `movement-detail-body`，与 `MovementDetailContent` 上下区块共用 `movement-detail-body.css`
- 只读：`section-bar` + `detail-grid`（dt/dd），与 Section I–VI 详情一致
- 可编辑（审批）：`section-bar` + `form-grid` + `form-control`，与转专业 FormModal 字段网格一致
- 不单独定义 input/section 样式，避免 drawer 内外视觉不一致
