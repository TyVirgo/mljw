# 学籍管理-异动查询与统计 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-movement-query-app

## 背景说明

`add-movement-approval-app`、`add-movement-maintenance` 已实现四 Tab 合并队列与宽表模式。`sr-movement-query` 菜单占位但未实现。查询页与维护页列结构高度重合，但数据范围为**全部非 Draft**，且**只读**（无实施/Edit/Delete），导出需接专业信息式 `ExportModal` + xlsx。

## 目标 / 非目标

**目标：**

- 只读宽表查询页（图示1–3）
- 双行搜索 + 收起/展开（图示1）
- 数据：四 Tab 合并非 Draft + 维护扩展列 normalize
- ExportModal → xlsx（当前页 / 全部 / 选中行）
- Details / Approval log 只读下钻
- ~~表头 sortable CSS 装饰~~（§9 移除；与维护一致无假排序）
- 注册 `sr-movement-query`

**非目标：**

- store 写入、审批动作
- Draft 记录进入列表
- 真实列排序
- 统计页、列头语言配置
- vue-router、后端 API

## 设计决策

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
  { key: 'app

## 来源：add-movement-statistics-app

## 背景说明

`add-movement-query-app`、`add-movement-maintenance` 已实现四 Tab 明细宽表与 ExportModal xlsx 导出。`sr-movement-statistics` 菜单占位未实现。产品图示1–2 要求**按专业×Intake 聚合**的计数透视表，语义为「该专业本学期每个类型学籍异动的人数」。

探索阶段已确认：非 Draft、applicationSession 过滤、仅展示有数据分组、前 4 列真实计数 + 后 7 列 supplement mock。**不更新 PRD**。

## 目标 / 非目标

**目标：**

- 聚合统计页（图示1–2 列结构）
- 双行搜索 + 收起（对齐 `MovementQueryView`）
- 前 4 列从四 Tab 真实聚合；后 7 列从 supplement 种子
- ExportModal → xlsx（对齐维护/查询）
- 注册 `sr-movement-statistics`

**非目标：**

- 修改 movementStore 四 Tab 以承载 Outbound Mobility 等类型
- 行操作 / 下钻
- PRD 文档
- 真实后端统计 API
- 全量专业×Intake 补零行

## 设计决策

### 1. 统计列定义 — 11 个计数 key

| key | 表头（EN） | 数据来源 |
|-----|-----------|----------|
| `programmeTransfer` | Programme Transfer | sourceKey `programme-transfer` |
| `deferment` | Deferment | sourceKey `deferment` |
| `withdrawal` | Withdrawal | sourceKey `withdrawal` |
| `resumption` | Resumption | sourceKey `resumption` |
| `outboundMobility` | Outbound Mobility | supplement |
| `expel` | Expel | supplement |
| `incomplete` | Incomplete | supplement |
| `completion` | Completion | supplement |
| `completionWithoutGraduation` | Completion without Graduation | supplement |
| `inboundMobility` | Inbound Mobility | supplement |
| `iep` | IEP | supplement |

行维度：`schoolCode`、`programmeCode`、`intake`。

### 2. 维度解析 — `resolveStatDimensions(sourceKey, item)`

维护页 `extractCurrentProgrammeCode` 仅转专业有值；统计需统一解析：

```javascript
// programme-transfer
schoolCode  ← schoolCodeFromName(currentSchool)  // 新增 SCHOOL_CODE_MAP
programmeCode ← programmeCodeFromName(currentProgramme)
intake ← currentIntake

// deferment / withdrawal
schoolCode ← schoolCodeFromName(schoolFromProgramme(item.programme))
programmeCode ← programmeCodeFromName(item.programme)
intake ← item.intake

// resumption
intake ← item.originalIntake
programmeCode / schoolCode ← 同上（item.programme 若存在）
```

**SCHOOL_CODE_MAP**（示例，可扩展以贴近图示 SOC/JRN）：

| Code | 学院 |
|------|------|
| SOC | School of Computing |
| SOB | School of Business |
| SOF | School of Foundation |

复用 `movementMaintenanceFields.js` 的 `PROGRAMME_CODE_MAP` / `PROGRAMME_SCHOOL_MAP`；图示 Programme Code（如 JRN）可按需追加映射。

### 3. 队列层 — `movementStatisticsQueue.js`

```javascript
import { mergeMovementQueryQueue, filterQueryBySearch } from './movementQueryQueue.js'
import { movementStatisticsSeeds } from './movementStatisticsSeeds.js'
import { STAT_COLUMN_KEYS, SOURCE_TO_COLUMN, SUPPLEMENT_COLUMN_KEYS } from './movementStatisticsColumns.js'

export function buildStatisticsRows(t, searc
