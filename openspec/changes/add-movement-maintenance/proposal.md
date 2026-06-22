## Why

学籍异动侧边栏「学籍异动维护」（`sr-movement-maintenance`）仍为建设中页。审批通过的异动申请需要在教务端 **统一实施、编制异动编号、补录 CGPA/预计毕业时间等维护字段**，并与四 Tab 申请、审批模块共用同一批 mock 数据。图示1–3 要求宽表列表 + 实施/改编号/Export/Delete + 行内 Edit | Details | Approval log。

## What Changes

### 主列表页（图示1）

- 注册 `sr-movement-maintenance` 为已开发页面
- 搜索区：Academic Session、异动原因、Status、Student ID、Student Name；Search / Reset；复用 `list-page-search.css`
- 工具栏：**实施**、**修改异动编号**、Export、Delete（勾选 + 确认）
- 主表列（图示1）：勾选、序号、Status、审批环节、是否实施、Student ID、Student Name、申请 Session、生效 Session、异动类别、异动原因、异动日期
- 扩展列（图示2，横向滚动）：Passport/IC、Student Type（Local/Chinese/International）、Intake、Current School、Current Programme Code、New School、New Programme Code、New Programme Name
- 尾部列（图示3）：English、CGPA、Expected Graduation Time、异动编号、Remark、Actions（**Edit** | **Details** | **Approval log**）
- 分页器（与异动审批一致）

### 数据范围

- 列表仅展示 **Status = Approved** 的记录（四 Tab 合并）
- **是否实施**：`Pending`（待实施）/ `Implemented`（已实施）；已审批默认 Pending
- 非适用扩展列显示「—」（如休学无 New Programme 列）

### 工具栏行为

- **实施**：勾选且 `implemented = Pending` 的行批量改为 `Implemented`，ConfirmDialog 确认
- **修改异动编号**：勾选行打开弹窗，为每行填写/修改 **异动编号**（可批量逐行编辑或统一赋值，首版单弹窗列表编辑）
- **Export**：mock 导出（alert 或 ExportModal，与审批页一致）
- **Delete**：勾选删除，ConfirmDialog；允许删除 Approved 记录（mock 物理删除 store）

### 行操作下钻

- **Edit**：`MovementMaintenanceEditModal` — 维护字段（异动编号、Remark、CGPA、Expected Graduation Time；转专业含 New School/Programme 等）
- **Details**：复用 `MovementApprovalReviewView` 只读展示申请内容
- **Approval log**：复用 `ApprovalLogModal`

### 数据模型扩展

- 在四 Tab store 记录上新增维护字段：`movementNumber`、`cgpa`、`expectedGraduationTime`、`maintenanceRemark`、`movementDate`、`implemented`
- **Mock 种子**：至少 **6 条 Approved** 完整记录（覆盖 Programme Transfer / Deferment / Withdrawal × Local / Chinese / International 组合，含 Pending/Implemented 混合）

## Capabilities

### New Capabilities

- `movement-maintenance`: 维护列表、队列合并、实施/改编号/Edit/Details/Log/Export/Delete

### Modified Capabilities

- `student-records-app`: `sr-movement-maintenance` 从建设中升级为已开发
- `movement-application-details`: 维护 Edit 弹窗字段与 Details 只读视图的数据来源说明（共用 store 记录）

## Impact

- **新增**
  - `MovementMaintenanceView.vue`
  - `MovementMaintenanceEditModal.vue`
  - `MovementMaintenanceNumberModal.vue`（修改异动编号）
  - `src/data/movementMaintenanceQueue.js`
  - `src/data/movementMaintenanceFields.js`（helper：扩展列取值、写回 store）
- **修改**
  - `movementStore` 四 Tab 初始 mock 补 Approved + 维护字段
  - `studentRecordsMenu.js`、`App.vue`
  - `src/i18n/locales/en.js`、`zh.js`、`zh-flat.js`
- **复用**
  - `ApprovalLogModal`、`MovementApprovalReviewView`、`ConfirmDialog`、`TablePagination`、`ExportModal`（可选）
- **Non-goals**
  - 真实写入学籍档案 / 后端 API
  - 异动查询、统计页
  - 修改审批流或重新打开已实施记录审批
