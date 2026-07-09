## 背景与动机

学籍异动侧边栏「学籍异动维护」（`sr-movement-maintenance`）仍为建设中页。审批通过的异动申请需要在教务端 **统一实施、编制异动编号、补录 CGPA/预计毕业时间等维护字段**，并与四 Tab 申请、审批模块共用同一批 mock 数据。图示1–3 要求宽表列表 + 实施/改编号/Export/Delete + 行内 Edit | Details | Approval log。

## 变更内容

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

## 能力范围

### 新增能力

- `movement-maintenance`: 维护列表、队列合并、实施/改编号/Edit/Details/Log/Export/Delete

### 修改的能力

- `student-records-app`: `sr-movement-maintenance` 从建设中升级为已开发
- `movement-application-details`: 维护 Edit 弹窗字段与 Details 只读视图的数据来源说明（共用 store 记录）；§11 `Scheduled` 状态
- `movement-list-academic-session-search`: 审批/维护/查询学年学期下拉（§11）

## 影响范围

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
- **新增**（§11）
  - `movementListSearchOptions.js`（或等价 helper）
  - `movementImplementationScheduler.js` — `processDueImplementations`
- **修改**（§11）
  - `MovementApprovalView.vue`、`MovementQueryView.vue` — 学年学期 select
  - `movementApprovalQueue.js`、`movementMaintenanceQueue.js`、`movementQueryQueue.js` — academicSession 精确匹配
  - `movementApprovalEngine.js` — autoImplement 延迟
- **复用**
  - `ApprovalLogModal`、`MovementApprovalReviewView`、`ConfirmDialog`、`TablePagination`、`ExportModal`（可选）
- **非目标**
  - 真实写入学籍档案 / 后端 API（mock 档案写入仍限于 `applyStudentProfileFromMovement`）
  - 异动统计页学年学期下拉（§11 不含）
  - 修改审批流或重新打开已实施记录审批
  - 真实后端 cron 定时任务

---

## §7 搜索：专业代码替换异动原因（增量）

与审批 / 查询 / 统计四模块搜索字段对齐：**去掉异动原因，增加专业代码**（紧挨学年学期）。

| 变更 | 说明 |
|------|------|
| 删除 | 搜索区「异动原因」 |
| 新增 | **专业代码** 文本搜索 |
| 过滤 | `filterMaintenanceBySearch`：`programmeCode` substring；依赖队列 `programmeCode`（`normalizeQueueItem` / `resolveStatDimensions`） |

### 设计决策（

- 专业代码语义与统计 `resolveStatDimensions` 一致；转专业仅现专业代码
- 表格「异动原因」列 **不变**（仅搜索去掉）

---

## §8 维护列表 UI 精简与只读（增量）

产品反馈：维护页表格过宽、含不应展示的列；维护模块**不可编辑**；Passport/IC 需脱敏。

### 工具栏

| 移除 | 保留 |
|------|------|
| 修改异动编号 | 实施、Export、Delete |

### 行操作

| 移除 | 保留 |
|------|------|
| Edit | Details、Approval log |

### 表格列

| 变更 | 说明 |
|------|------|
| 移除列 | CGPA、English、异动编号、Remark |
| 表格隐藏 | Current/New School、Current/New Programme Code、New Programme Name（**Details 详情仍展示**） |
| Passport/IC | 列表脱敏 |
| 是否实施 | **Y/N**（Implemented→Y，其余→N） |
| 搜索 | zh「学年学期」（对齐其它模块） |

### 脱敏（三端一致）

- 列表 `passportIc`、Details（`maskSensitiveFields`）、Export 均用 `maskPassportIc()`
- 详情含 `parentNricPassport`（休学/退学家长证件）同样脱敏
- 审批/查询详情不脱敏

### 设计决策（

| 项 | 决策 |
|----|------|
| Edit / 改编号 | 移除 UI；store 字段可保留 |
| 详情校字段 | 仅表格隐藏，DetailModal 保留 |
| Export | 专用列集 + 脱敏 + Y/N |

---

## §9 状态 Badge 与申请页一致（增量）

维护列表 Status 列当前类名正确（`statusBadgeClass`），但 scoped 样式 `color: #fff` 覆盖且未加载状态色 CSS，与四 Tab 申请页 pill 标签不一致。

### 变更

| 项 | 说明 |
|----|------|
| CSS | `import movement-status-badge.css`；更新为 **pill**（`border-radius: 999px`，与 `DefermentView` 等申请页一致） |
| 类名 | 继续 `statusBadgeClass(status)`；`Expired` → `status-expired`（与审批 `approvalStatusBadgeClass` 同逻辑） |
| 移除 | scoped `.status-badge { color: #fff; }` 及重复状态色定义 |

### 设计决策（

| 项 | 决策 |
|----|------|
| 色板 | 与四 Tab 申请页相同（浅底 + 深字） |
| 形态 | pill 圆角 |
| Expired | 支持 `status-expired` |

---

## §11 批量勾选、学年学期下拉、延迟实施（2026-06）

产品反馈：维护页批量操作需限制可勾选行；审批/维护/查询「学年学期」搜索改为下拉；实施需按**当前学年学期 vs 生效学期**决定是否立即写入学籍档案。

### 11.1 维护列表勾选（批量实施）

| 是否实施列 | store `implemented` | 行勾选 | 表头全选 |
|-----------|---------------------|--------|----------|
| N | `Pending` | ✓ 可勾 | 仅选中当前页 Pending |
| N | `Scheduled`（待生效） | ✗ disabled | 不包含 |
| Y | `Implemented` | ✗ disabled | 不包含 |

- 已勾选的 Y/Scheduled 行在搜索/翻页时从 `selectedKeys` 清除
- **Delete** 与 **Implement** 共用同一勾选规则（Y/Scheduled 不可选）

### 11.2 学年学期搜索下拉（审批 + 维护 + 查询）

- 三模块搜索区「学年学期 / Academic Session」由 **文本框 → 下拉**
- 选项：`merge*Queue` 结果中 **`applicationSession` 去重排序** + 首项「全部」
- 过滤：**精确匹配**（替换现有 substring `matchText`）
- 共享 helper：`getDistinctApplicationSessions(items)`；可选组件 `MovementAcademicSessionSelect.vue`
- **不在范围**：异动申请 Tab 的 `applicationSession` 搜索（仍属申请模块）

### 11.3 延迟实施（生效学期门控）

**当前学期**：`getCurrentApplicationSession()`（`semesterInfo` mock）。

用户点击 **实施** 且确认后，对每条 Pending 行：

```
currentSession === effectiveSession ?
  YES → applyImplementationEffect（档案变更 + implemented: Implemented → 列 Y）
  NO  → implemented: Scheduled；档案与申请业务字段不变；列仍显示 N
```

**Mock 定时**：`processDueImplementations()` — 扫描 `implemented === 'Scheduled'` 且 `currentSession >= effectiveSession` 的记录，执行 `applyImplementationEffect`。

- 触发点：`App.vue` 或进入维护/学籍模块时调用（本阶段无真实 cron）
- Confirm 文案区分：立即生效 vs 「将于 {effectiveSession} 学年学期自动生效」

**自动实施对齐**：`movementApprovalEngine` 审批通过且类别 `autoImplement` 时，同样走生效学期门控（非当前学期 → `Scheduled`）。

### 能力范围（§11 增量）

- `movement-maintenance`: 可勾选规则、延迟实施、Scheduled 状态
- `movement-list-academic-session-search`: 审批/维护/查询学年学期下拉

### 影响范围（§11 增量）

- **修改** `MovementMaintenanceView.vue` — 勾选逻辑
- **修改** `MovementApprovalView.vue`、`MovementQueryView.vue` — 学年学期 select
- **修改** `movementMaintenanceFields.js`、`movementApprovalEngine.js` — Scheduled + processor
- **新增** `movementImplementationScheduler.js`（或同名 util）
- **修改** `movementApprovalQueue.js` — `formatImplementedYn`：Scheduled→N
- **修改** 三处 `filter*BySearch` — academicSession 精确匹配
- **非目标** — 真实后端定时任务；统计页搜索（除非后续单独变更）

---

## §12 是否实施 Y/N 公共 UI 组件（2026-06，原型确认后补档）

§8 已将列表「是否实施」改为 Y/N 展示；2026-06 实现阶段进一步抽取公共组件，供维护、查询、审批 History 列表复用，避免各页内联 `formatImplementedYn` 与重复 select 选项。

### 范围

- **新增** `ImplementedYnBadge.vue` — 列表单元格 Y/N 徽章（读 `formatImplementedYn`）
- **新增** `ImplementedYnSearchSelect.vue` — 搜索区是否实施下拉（选项 `Y` / `N`，首项全部）
- **修改** `MovementMaintenanceView.vue`、`MovementQueryView.vue`、`MovementApprovalView.vue` — 列表列与搜索区接入上述组件
- **数据层不变** — 仍使用 `movementApprovalQueue.js` 的 `formatImplementedYn`、`matchesImplementedYnFilter`

### 能力范围（§12 增量）

- `movement-maintenance`：是否实施列/筛选项 UI 组件化
- `movement-query-app`：同上（与维护对齐）

### 影响范围（§12 增量）

- **新增** `src/components/common/ImplementedYnBadge.vue`、`ImplementedYnSearchSelect.vue`
- **修改** 维护/查询/审批三 View — 替换内联 Y/N 渲染与搜索 select
