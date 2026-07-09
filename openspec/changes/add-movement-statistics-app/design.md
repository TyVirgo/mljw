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

export function buildStatisticsRows(t, search) {
  // 1. 四 Tab 非 Draft → normalize 或 lightweight map
  const applications = filterQueryBySearch(mergeMovementQueryQueue(t), search)
  // 2. supplement → filterBySearch（同 5 字段 + applicationSession）
  const supplements = filterStatisticsSeeds(movementStatisticsSeeds, search)
  // 3. 累加到 Map<groupKey, counts>
  // 4. 过滤全 0 分组
  // 5. 排序（如 schoolCode, programmeCode, intake）
  return rows
}
```

**applicationSession 过滤**：对四 Tab 记录使用 `normalizeQueueItem` 的 `applicationSession`；supplement 条目显式带 `applicationSession` 字段。

**与查询 filter 复用**：`filterQueryBySearch` 对 application 行直接适用；supplement 需平行实现相同 5 字段匹配（无 movementReason 时可留空或可选填）。

### 4. Supplement 种子 — `movementStatisticsSeeds.js`

统计专用，**不进入** `movementStore` / query / maintenance 队列：

```javascript
export const movementStatisticsSeeds = [
  {
    schoolCode: 'SOC',
    programmeCode: 'SWE',
    intake: '2024/02',
    applicationSession: '2024/02',
    statColumn: 'outboundMobility',
    movementReason: '',      // 可选，供原因筛选
    status: 'Approved',      // 可选，供状态筛选
    studentId: '',           // 可选
    studentName: '',
  },
  // ... 15–25 条，覆盖 6 个分组、7 列分布合理非零
]
```

`statColumn` 必须是 7 个 supplement key 之一。

### 5. UI — `MovementStatisticsView.vue`

结构参考 `MovementQueryView.vue`：

```
MovementStatisticsView
  ├── .search-bar（双行 + 收起，searchExpanded = true）
  ├── .toolbar → Export only
  ├── .table-wrap（宽表，无 Actions 列）
  ├── TablePagination
  └── ExportModal
```

**移除**（相对 Query）：ReviewView、ApprovalLogModal、Details/Log 行操作、sortable 可选保留。

**表格列顺序**（对齐图示）：

序号 | School Code | Programme Code | Intake | PT | DEF | WDR | RES | Outbound | Expel | Incomplete | Completion | CwG | Inbound | IEP

计数单元格为 **数字**（0 也展示，分组内某列无数据为 0）。

### 6. 导出

**字段** — `movementStatisticsExportFields.js`：

- 3 维度 + 11 计数列，`selectedByDefault: true`
- `useListPageI18n(movementStatisticsExportFields)`

**写出** — `exportMovementStatisticsExcel.js`：

- 模式同 `exportMovementQueryExcel.js`
- `formatStatisticsExportRow(row, index, { t })`
- filename: `movement-statistics-{date}.xlsx`
- sheetName: `Movement Statistics`

**handleExportConfirm**：与 Query/Maintenance 相同三档 scope；row key 用 `groupKey`（如 `SOC|SWE|2024/02`）。

### 7. i18n

命名空间 `movementStatistics.*`：

- `columns.schoolCode`、`columns.programmeCode`、`columns.intake`
- 11 个计数列 label（可与 movement category 枚举对齐）
- `search.*` 复用 `movementQuery.search` 或 `movementApproval.search`

### 8. 路由与菜单

```javascript
studentRecordsDevelopedPages.add('sr-movement-statistics')
// App.vue: isMovementStatistics → MovementStatisticsView
```

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 非 PT 记录 programme 解析不一致 | 统一 `resolveStatDimensions`；deferment 等已有 `programme` 字段 |
| 前 4 列与查询明细数字不一致 | 同源 filter + 同 Session 字段；文档说明对照方式 |
| supplement 与真实业务脱节 | 仅后 7 列；proposal/design 标明 mock |
| 搜索 movementReason 对 supplement | seed 可选填 reason 或筛选时忽略无 reason 的 supplement |

## 迁移说明

1. `movementStatisticsColumns.js` + `movementStatisticsSeeds.js`
2. `movementStatisticsQueue.js` + `resolveStatDimensions` / `SCHOOL_CODE_MAP`
3. Export fields + xlsx util
4. `MovementStatisticsView.vue` + i18n
5. 菜单 + App.vue
6. 冒烟：约 6 行、Session 过滤、Export 三 scope、前 4 列与查询可对照
7. `npm run build`

## 待决问题

（探索阶段已全部确认，无遗留）

### 9. §8 菜单暂缓

- 从 `studentRecordsMenuItems` 移除 `sr-movement-statistics`
- 从 `studentRecordsDevelopedPages` 移除对应 id
- **不删除** `MovementStatisticsView.vue` 及 statistics 数据层
- 后续 change 恢复菜单时仅改 menu + developedPages
