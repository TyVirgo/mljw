## Context

`add-movement-approval-app`、`add-movement-maintenance` 已实现四 Tab 合并队列与宽表模式。`sr-movement-query` 菜单占位但未实现。查询页与维护页列结构高度重合，但数据范围为**全部非 Draft**，且**只读**（无实施/Edit/Delete），导出需接专业信息式 `ExportModal` + xlsx。

## Goals / Non-Goals

**Goals:**

- 只读宽表查询页（图示1–3）
- 双行搜索 + 收起/展开（图示1）
- 数据：四 Tab 合并非 Draft + 维护扩展列 normalize
- ExportModal → xlsx（当前页 / 全部 / 选中行）
- Details / Approval log 只读下钻
- ~~表头 sortable CSS 装饰~~（§9 移除；与维护一致无假排序）
- 注册 `sr-movement-query`

**Non-goals:**

- store 写入、审批动作
- Draft 记录进入列表
- 真实列排序
- 统计页、列头语言配置
- vue-router、后端 API

## Decisions

### 1. 队列层 — `movementQueryQueue.js`

```javascript
import { normalizeMaintenanceItem } from './movementMaintenanceQueue.js'
// 或 export normalizeQueryItem 别名，避免重复 extract 逻辑

export function mergeMovementQueryQueue(t) {
  const sources = [programme-transfer, deferment, resumption, withdrawal]
  const rows = []
  for (const [sourceKey, list] of sources) {
    for (const item of list) {
      if (item.status === 'Draft') continue
      rows.push(normalizeMaintenanceItem(sourceKey, item, t))
    }
  }
  return rows.sort(by submittedAt desc)
}

export function filterQueryBySearch(items, search) {
  // 同 filterMaintenanceBySearch / filterBySearch
  // academicSession, movementReason, status, studentId, studentName
}
```

**与维护差异**

| 维度 | 维护 | 查询 |
|------|------|------|
| status 过滤 | 仅 Approved | 非 Draft 全部 |
| Status 下拉 | Approved | movementApprovalStatusOptions |
| implemented | Pending/Implemented | 非 Approved 多为 — |

### 2. 搜索 UI — 双行 + 收起

参考 `CourseInformationView.vue`：

```
searchExpanded = true（默认展开，与产品图一致）

Row 1（始终可见）:
  academicSession | movementReason | status
  [Search] [Reset] [收起 ▲]

Row 2（v-if searchExpanded）:
  studentId | studentName
```

- 收起按钮：`t('common.collapse')` / `t('common.more')`
- `Transition name="search-expand"` 可选

### 3. 列表 UI — `MovementQueryView.vue`

结构从 `MovementMaintenanceView.vue` 精简：

```
MovementQueryView
  ├── .search-bar（双行 + 收起）
  ├── .toolbar → Export only
  ├── .table-wrap（宽表，sticky Actions）
  ├── TablePagination
  ├── ExportModal
  ├── MovementApprovalReviewView（viewMode=review, mode=readonly）
  └── ApprovalLogModal
```

**移除**：ConfirmDialog、EditModal、NumberModal、Implement/Delete 工具栏、canImplement。

**行 Actions**：`Details | Approval log`（无 Edit）。

**表头**：普通 `<th>`，无 sortable 装饰（§9 与维护一致）。

### 4. 导出 — xlsx + ExportModal

**字段定义** — `movementQueryExportFields.js`：

```javascript
export const movementQueryExportFields = [
  { key: 'status', labelKey: '...', selectedByDefault: true },
  { key: 'approvalStage', ... },
  // ... 图1–3 全部列 key
]
```

配合 `useListPageI18n(movementQueryExportFields)` 供 ExportModal 展示。

**写出** — `exportMovementQueryExcel.js`：

- 依赖 `xlsx`（项目已有）
- 模式同 `exportProgrammeVersionExcel.js`
- `formatQueryRow(row, index, t)` 将 queue 项转为导出单元格（i18n 状态、studentType 等）
- `exportMovementQueryToExcel(rows, filename, selectedFieldKeys)`

**handleExportConfirm**：

```javascript
if (exportScope === 'currentPage') data = paginatedItems
else if (exportScope === 'allResults') data = filteredItems
else data = filteredItems.filter(row => selectedKeys.includes(row.queueKey))
exportMovementQueryToExcel(data, `movement-query-${date}.xlsx`, selectedFields)
```

### 5. 只读下钻

与维护页相同：

- `openDetails(row)` → `reviewItem = row`, `viewMode = 'review'`, `mode = 'readonly'`
- `openApprovalLog(row)` → `ApprovalLogModal`
- `DEFAULT_APPROVER_ROLE` 传入 ReviewView

### 6. i18n

命名空间 `movementQuery.*`：

- 搜索 label（可复用 `movementApproval.search.*` / `movementMaintenance.columns.*`）
- export 字段 labelKey
- 若无新文案，优先复用 maintenance/approval 键，减少重复

### 7. 路由与菜单

```javascript
studentRecordsDevelopedPages.add('sr-movement-query')
// App.vue: isMovementQuery → MovementQueryView
```

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 与 MaintenanceView 大段重复 | 首版复制后精简；后续可抽 `MovementWideTable` 组件（非本期） |
| normalizeMaintenanceItem 命名语义 | query 复用同一 normalize；注释说明 |
| 宽表 23+ 列 export 字段多 | ExportModal 默认勾选核心列 |
| 非 Approved 扩展列为空 | 与维护一致显示 — |

## Migration Plan

1. `movementQueryQueue.js`
2. `movementQueryExportFields.js` + `exportMovementQueryExcel.js`
3. `MovementQueryView.vue` + i18n
4. 菜单 + App.vue
5. 冒烟：非 Draft 可见、收起搜索、Export 三 scope xlsx、Details/Log
6. `npm run build`

## Open Questions

（探索阶段已全部确认，无遗留）

### 8. §8 异动类型搜索

**首行布局（§7 后）：**

```
学年学期 | 专业代码 | 状态 | 异动类型 | [查询] [重置] [收起]
次行：学号 | 姓名
```

**数据层：**

```javascript
export const movementQueryTypeOptions = [
  'programme-transfer',
  'deferment',
  'resumption',
  'withdrawal',
]

// filterQueryBySearch
if (s.movementType && row.sourceKey !== s.movementType) return false
```

队列行已有 `sourceKey`（`normalizeQueueItem`），无需 normalize 增量字段。

**i18n：** `movementQuery.search.movementType`（中文「异动类型」）；选项文案 `t('menu.sr*')`。

### 9. §9 列表 UI 与维护对齐

**目标表格列（与 `MovementMaintenanceView` §8 一致）：**

```
勾选 | 序号 | 状态 | 审批环节 | 是否实施(Y/N) | 学号 | 姓名 | 异动日期
| Passport/IC(脱敏) | Student Type | Intake | 申请/生效学期 | 类别 | 原因 | 预计毕业 | Actions
```

**列表实现要点：**

- 从 `MovementMaintenanceView.vue` 对齐表头顺序与 tbody 渲染
- `displayPassportIc` → `maskPassportIc`；`implementedDisplay` → `formatImplementedYn`
- 移除 9 列宽表字段（校/专业五列 + English + CGPA + 编号 + Remark）
- 移除所有 `<th class="sortable">` 及 scoped `.data-table th.sortable::after` 规则
- `colspan` 空态改为 17

**Details：**

```vue
<MovementApprovalReviewView
  :mask-sensitive-fields="true"
  ...
/>
```

校/专业等扩展字段仍在 ReviewView / DetailModal 内展示，仅列表隐藏。

**Export — 两层列集：**

```javascript
// movementQueryExportFields.js
import { movementMaintenanceExportColumnMeta } from './movementMaintenanceExportFields.js'

const queryOptionalColumns = [
  { key: 'currentSchool', ... },
  { key: 'currentProgrammeCode', ... },
  { key: 'newSchool', ... },
  { key: 'newProgrammeCode', ... },
  { key: 'newProgrammeName', ... },
  { key: 'englishName', ... },
  { key: 'cgpa', ... },
  { key: 'movementNumber', ... },
  { key: 'remark', ... },
]

export const movementQueryExportColumnMeta = [
  ...movementMaintenanceExportColumnMeta,
  ...queryOptionalColumns,
]
```

**handleExportConfirm：**

```javascript
exportMovementQueryToExcel(data, filename, selectedFields, { t, tr }, sheetName, {
  columnMeta: movementQueryExportColumnMeta,
  implementedAsYn: true,
  maskPassport: true,
})
```

`formatQueryExportRow` 已支持全部 key，无需队列层变更。

**与维护差异（刻意保留）：**

| 维度 | 维护 | 查询 §9 后 |
|------|------|------------|
| 数据范围 | Approved only | 非 Draft 全部 |
| 列表列 | 17 列精简 | 17 列精简（同） |
| Export 可选列 | 无 | 9 个额外可选 |
| 工具栏 | 实施/Export/Delete | Export only |
| sortable 装饰 | 无 | 无（§9 移除） |

### 10. §10 状态 Badge 与申请页一致

与 `add-movement-maintenance` §9 共用 `movement-status-badge.css`（pill + 申请色板）。

```vue
// MovementQueryView.vue
import '../../styles/movement-status-badge.css'

function listStatusBadgeClass(status) {
  if (status === 'Expired') return 'status-expired'
  return defermentStatusBadgeClass(status)
}
```

移除 scoped `.status-badge { color: #fff; }`。查询页多状态（In Progress / Rejected 等），对齐后视觉收益最大。
