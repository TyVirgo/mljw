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

## 7. 搜索：专业代码替换异动原因

- [x] 7.1 `filterQueryBySearch`：`programmeCode` 替换 `movementReason`
- [x] 7.2 `MovementQueryView.vue`：首行原因 → 专业代码
- [x] 7.3 i18n：`movementQuery.search.programmeCode`
- [x] 7.4 冒烟 + `npm run build` 通过

## 8. 搜索增加异动类型

- [x] 8.1 `movementQueryQueue.js`：`movementQueryTypeOptions` + `filterQueryBySearch` 支持 `movementType`
- [x] 8.2 `MovementQueryView.vue`：首行状态后异动类型 select；`createEmptySearch` 增字段
- [x] 8.3 i18n：`movementQuery.search.movementType`；选项复用 `menu.sr*`
- [x] 8.4 冒烟：选「休学」仅 deferment 行 + `npm run build` 通过

## 9. 列表 UI 与维护对齐（三端一致 + Export 可选列）

- [x] 9.1 `MovementQueryView.vue`：表格列精简为 17 列，列顺序对齐维护 §8
- [x] 9.2 列表 Passport/IC 脱敏（`maskPassportIc`）；是否实施改为 Y/N（`formatImplementedYn`）
- [x] 9.3 Details：`MovementApprovalReviewView` 传 `:mask-sensitive-fields="true"`
- [x] 9.4 `movementQueryExportFields.js`：默认列 = `movementMaintenanceExportColumnMeta`；追加 9 个 `selectedByDefault: false` 可选列
- [x] 9.5 `handleExportConfirm`：`exportMovementQueryToExcel` 传 `implementedAsYn: true`、`maskPassport: true`
- [x] 9.6 移除表头 `sortable` class 与 `::after` 装饰 CSS
- [x] 9.7 冒烟：列表/Export/Details 脱敏与 Y/N 一致；Export 可选列可勾选 + `npm run build` 通过

## 10. 状态 Badge 与申请页一致

- [x] 10.1 `MovementQueryView.vue`：import `movement-status-badge.css`；`listStatusBadgeClass`（含 Expired）；移除 scoped 白字覆盖
- [x] 10.2 依赖 `add-movement-maintenance` §9 对 `movement-status-badge.css` 的 pill 更新（或同 PR 一并改 CSS）
- [x] 10.3 冒烟：各状态色与申请 Tab 一致 + `npm run build` 通过

## 11. 移除 Expected Graduation Time 列

- [x] 11.1 `MovementQueryView.vue`：列表去掉 Expected Graduation Time 列；colspan 16
- [x] 11.2 与维护 §10 共用：`movementMaintenanceExportFields.js`、`exportMovementQueryExcel.js`、`movementMaintenanceQueue.js`
- [x] 11.3 `movement-query-app/spec.md` §9 同步：精简列不含 expected graduation time
- [x] 11.4 冒烟 + `npm run build` 通过
