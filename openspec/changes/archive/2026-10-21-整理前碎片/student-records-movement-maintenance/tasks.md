# 学籍管理-异动维护 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-movement-list-pdf-preview

```
## 1. PDF 工具

- [x] 1.1 exportMovementDetailPdf 支持 blob 生成与 revoke

## 2. 预览 Modal

- [x] 2.1 MovementDetailPdfPreviewModal
- [x] 2.2 i18n

## 3. 列表集成

- [x] 3.1 MovementMaintenanceView 操作列 + Modal
- [x] 3.2 MovementQueryView 操作列 + Modal

## 4. 验证

- [x] 4.1 npm run build
```

### add-movement-maintenance

```
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
- [x] 7.2 `MovementMaintenanceView.vue`：
```

### add-movement-maintenance-archive-number

```
## 1. 数据与 PDF 命名

- [x] 1.1 `movementArchiveNumber.js` 校验与展示辅助
- [x] 1.2 `resolveMovementExportArchiveNumber` 取消随机回退
- [x] 1.3 `updateExportArchiveNumber` + 队列映射文号列

## 2. 界面
- [x] 2.1 `MovementArchiveNumberModal.vue`
- [x] 2.2 `MovementMaintenanceView` 文号列（学号前）+ 修改文号按钮
- [x] 2.4 文号列移至学号前一列（`MOVEMENT_MAINTENANCE_TABLE_COLUMNS`）

## 3. 验证

- [x] 3.1 `npm run build`
```

### refine-movement-maintenance-pdf-action-label

```
## 1. 维护列表按钮

- [x] 1.1 `MovementMaintenanceView` PDF 按钮改用 `movementExport.exportPdf`

## 2. 验证

- [x] 2.1 `npm run build`
```

### refine-movement-maintenance-query-list-columns-search

```
## 1. 数据层

- [x] 1.1 nationality + 共享列配置/搜索 filter
- [x] 1.2 i18n

## 2. 界面
- [x] 2.1 MovementListSearchBar + 两页表格列重排
- [x] 2.2 搜索区对齐学生基本信息（主行/展开行、查询重置按钮、Enter 查询）

## 3. 导出

- [x] 3.1 export 列顺序与 effectiveDate

## 4. 验证

- [x] 4.1 npm run build
```
