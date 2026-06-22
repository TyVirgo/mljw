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
