## 1. 数据层

- [x] 1.1 创建 `movementMaintenanceFields.js`：维护字段默认值、`updateMaintenanceFields`、`implementMaintenanceRecords`、`deleteMaintenanceRecords`
- [x] 1.2 创建 `movementMaintenanceQueue.js`：`mergeMovementMaintenanceQueue`、`normalizeMaintenanceItem`、`filterMaintenanceBySearch`
- [x] 1.3 扩展四 Tab mock：至少 6 条 `Approved` + 维护字段（PT×2、DEF×2、WDR、RES）
- [x] 1.4 扩展列 helper：passportIc、studentType、programme 扩展列取值（非 PT 返回「—」）

## 2. i18n

- [x] 2.1 在 `en.js`、`zh.js` 新增 `movementMaintenance.*`（搜索、列、工具栏、弹窗）
- [x] 2.2 Student Type Chinese → 「中国」；Implemented/Pending 文案
- [x] 2.3 在 `zh-flat.js` 同步 flat 映射（Edit/Details/Approval Log 等已有映射）

## 3. 弹窗组件

- [x] 3.1 创建 `MovementMaintenanceEditModal.vue`（维护字段 + PT 条件字段，Cancel+Save）
- [x] 3.2 创建 `MovementMaintenanceNumberModal.vue`（勾选行批量改异动编号，Cancel+Save）

## 4. 列表页

- [x] 4.1 创建 `MovementMaintenanceView.vue`：搜索（list-page-search.css）、宽表、横向滚动、sticky Actions
- [x] 4.2 工具栏：实施、修改异动编号、Export、Delete + ConfirmDialog
- [x] 4.3 行操作：Edit、Details（MovementApprovalReviewView）、Approval log（ApprovalLogModal）

## 5. 路由与菜单

- [x] 5.1 `studentRecordsDevelopedPages` 加入 `sr-movement-maintenance`
- [x] 5.2 `App.vue` import + `isMovementMaintenance` + 渲染 `MovementMaintenanceView`

## 6. 验证

- [x] 6.1 冒烟：6 条 Approved → 实施 → 改编号 → Edit → Details/Log → Delete
- [x] 6.2 确认列表不含 Draft/In Progress
- [x] 6.3 `npm run build` 通过

## 7. 搜索：专业代码替换异动原因

- [x] 7.1 `filterMaintenanceBySearch`：`programmeCode` 替换 `movementReason`（队列项需含 programmeCode）
- [x] 7.2 `MovementMaintenanceView.vue`：搜索区原因 → 专业代码
- [x] 7.3 i18n：`movementMaintenance.search.programmeCode`
- [x] 7.4 冒烟 + `npm run build` 通过

## 8. 列表 UI 精简、只读与脱敏

- [x] 8.1 `maskPassportIc.js` + 列表/详情/Export 三端脱敏（含 parentNricPassport）
- [x] 8.2 移除 Edit、修改异动编号（工具栏/行操作/Modal 引用）
- [x] 8.3 表格列精简：隐藏校/专业五列；去掉 CGPA/English/编号/Remark；Implemented→Y/N
- [x] 8.4 `movementMaintenanceExportFields.js` + Export 脱敏/Y/N
- [x] 8.5 i18n：`movementMaintenance.search.academicSession` → 学年学期（zh）
- [x] 8.6 ReviewView `:mask-sensitive-fields="true"`；DetailModal prop 传递
- [x] 8.7 冒烟 + `npm run build` 通过

## 9. 状态 Badge 与申请页一致

- [x] 9.1 更新 `movement-status-badge.css`：pill 圆角 + 与申请页一致的 padding/字重
- [x] 9.2 `MovementMaintenanceView.vue`：import 共享 CSS；`listStatusBadgeClass`（含 Expired）；移除 scoped 白字覆盖
- [x] 9.3 冒烟：各状态色与申请 Tab 一致 + `npm run build` 通过

## 10. 移除 Expected Graduation Time 列

- [x] 10.1 `MovementMaintenanceView.vue` / `MovementQueryView.vue`：列表去掉 Expected Graduation Time 列；colspan 16
- [x] 10.2 `movementMaintenanceQueue.js`：normalize 不再输出 `expectedGraduationTime`
- [x] 10.3 `movementMaintenanceExportFields.js` + `exportMovementQueryExcel.js`：导出不含该列
- [x] 10.4 `MovementMaintenanceEditModal.vue`：编辑表单去掉该字段
- [x] 10.5 冒烟 + `npm run build` 通过

## 11. §11 批量勾选、学年学期下拉、延迟实施

- [x] 11.1 `movement-maintenance/spec.md` + `movement-list-academic-session-search/spec.md` + `movement-application-details` §11 delta
- [x] 11.2 `movementListSearchOptions.js`（或 queue 层）：`getDistinctApplicationSessions`；三处 filter 精确匹配
- [x] 11.3 `MovementMaintenanceView.vue`：仅 Pending 可勾选；表头全选仅 Pending
- [x] 11.4 `MovementApprovalView.vue`、`MovementQueryView.vue`：学年学期改 select + 选项 distinct
- [x] 11.5 `movementMaintenanceFields.js`：`requestImplementation`、Scheduled；`processDueImplementations`
- [x] 11.6 `movementApprovalEngine.js`：autoImplement 走生效学期门控
- [x] 11.7 `App.vue`（或入口）调用 `processDueImplementations`；Confirm i18n
- [x] 11.8 seed：至少 1 条 effectiveSession 晚于 current 的 Pending 便于 demo
- [x] 11.9 冒烟：Y/Scheduled 不可勾；下拉过滤；未到生效学期 Scheduled→processor→Y；`npm run build` 通过

## 12. §12 是否实施 Y/N 公共 UI 组件

- [x] 12.1 新增 `ImplementedYnBadge.vue`、`ImplementedYnSearchSelect.vue`
- [x] 12.2 `MovementMaintenanceView.vue`：列表列 + 搜索区接入组件
- [x] 12.3 `MovementQueryView.vue`、`MovementApprovalView.vue`：列表列接入 Badge
- [x] 12.4 确认 Export 仍使用 `formatImplementedYn`（组件仅 UI 层）
