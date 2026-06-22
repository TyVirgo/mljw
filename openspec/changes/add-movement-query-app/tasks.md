## 1. 数据层

- [x] 1.1 创建 `src/data/movementQueryQueue.js`：`mergeMovementQueryQueue`（非 Draft）、`filterQueryBySearch`
- [x] 1.2 复用 `normalizeMaintenanceItem` 作为 query 行 normalize（扩展列与维护一致）
- [x] 1.3 导出 `movementQueryStatusOptions`（复用 `movementApprovalStatusOptions`）

## 2. 导出

- [x] 2.1 创建 `src/data/movementQueryExportFields.js`（图1–3 全部列 key + labelKey + selectedByDefault）
- [x] 2.2 创建 `src/utils/exportMovementQueryExcel.js`（xlsx，模式对齐 `exportProgrammeVersionExcel.js`）
- [x] 2.3 `formatQueryExportRow`：状态/studentType/类别 i18n 展示值

## 3. i18n

- [x] 3.1 在 `en.js`、`zh.js` 新增或复用 `movementQuery.*`（搜索、导出字段）
- [x] 3.2 Student Type Chinese → 「中国」（复用 `movementMaintenance.studentType.Chinese`）

## 4. 列表页

- [x] 4.1 创建 `MovementQueryView.vue`：双行搜索 + 收起（默认展开）、Export 工具栏
- [x] 4.2 宽表列（图示1–3）、横向滚动、sticky Actions、sortable CSS 装饰（无真排序）
- [x] 4.3 勾选列（供 Export 选中行）
- [x] 4.4 集成 `ExportModal` + `TablePagination`
- [x] 4.5 行操作：Details（MovementApprovalReviewView readonly）、Approval log（ApprovalLogModal）
- [x] 4.6 确认无 Edit / 实施 / Delete / ConfirmDialog 写操作

## 5. 路由与菜单

- [x] 5.1 `studentRecordsDevelopedPages` 加入 `sr-movement-query`
- [x] 5.2 `App.vue` import + `isMovementQuery` + 渲染 `MovementQueryView`

## 6. 验证

- [x] 6.1 冒烟：非 Draft 记录可见（含 In Progress / Approved / Rejected）
- [x] 6.2 搜索收起：次行 Student ID/Name 可隐藏
- [x] 6.3 Export：当前页 / 全部 / 选中行 → xlsx 下载
- [x] 6.4 Details / Approval log 只读下钻
- [x] 6.5 `npm run build` 通过
