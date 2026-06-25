## Why

学籍异动侧边栏「学籍异动查询」（`sr-movement-query`）仍为建设中页。教务人员需要在一个**只读**宽表中检索、浏览全部异动申请记录（含各审批状态），并支持字段可选的 **xlsx 导出**，无需像维护页那样实施或改数据。产品图示1–3 定义搜索区、宽表列与行内 **Details | Approval log**；图示4 要求导出交互对齐专业信息模块的 `ExportModal`。

## What Changes

### 主列表页（图示1–3）

- 注册 `sr-movement-query` 为已开发页面
- **搜索区（双行 + 收起）**
  - 首行：Academic Session、异动原因、Status；Search / Reset / 收起
  - 次行（可收起）：Student ID、Student Name
  - 默认展开次行；复用 `list-page-search.css`
- **工具栏**：仅 **Export**（打开 `ExportModal`，图示4）
- **宽表**（横向滚动 + sticky Actions）：
  - 图示1：勾选、序号、Status、审批环节、是否实施、Student ID/Name、申请/生效 Session、异动类别、异动原因、异动日期
  - 图示2：Passport/IC、Student Type、Intake、Current/New School & Programme 扩展列
  - 图示3：English、CGPA、Expected Graduation Time、异动编号、Remark、Actions（**Details | Approval log**）
- 表头 **sortable 样式**（↑↓ 装饰，首版无真实排序）
- 分页器（与维护/审批一致）

### 数据范围

- 四 Tab 合并，**排除 Draft**，包含 In Progress / Update Required / Approved / Rejected / Cancelled 等
- 扩展列与维护页相同规则（非转专业 programme 列显示「—」）
- 不新增 mock；读取现有 `movementStore`

### 只读下钻

- **Details** → `MovementApprovalReviewView`（`mode=readonly`）
- **Approval log** → `ApprovalLogModal`

### 导出（图示4）

- 复用 `ExportModal`：可选字段 ↔ 已选字段、导出当前页 / 全部结果 / 选中行
- 输出 **.xlsx**（`xlsx` 库，模式对齐 `ProgrammeVersionView` / `exportProgrammeVersionExcel.js`）

## Capabilities

### New Capabilities

- `movement-query-app`: 异动查询只读宽表、搜索收起、ExportModal xlsx 导出、Details/Log 下钻

### Modified Capabilities

- `student-records-app`: `sr-movement-query` 从建设中升级为已开发

## Impact

- **新增**
  - `MovementQueryView.vue`
  - `src/data/movementQueryQueue.js`
  - `src/data/movementQueryExportFields.js`
  - `src/utils/exportMovementQueryExcel.js`
- **修改**
  - `studentRecordsMenu.js` → `studentRecordsDevelopedPages` 加入 `sr-movement-query`
  - `App.vue` 挂载 `MovementQueryView`
  - `src/i18n/locales/en.js`、`zh.js`
- **复用**
  - `normalizeMaintenanceItem` / 扩展列 extract（`movementMaintenanceQueue.js` 或抽公共）
  - `MovementApprovalReviewView`、`ApprovalLogModal`、`ExportModal`、`TablePagination`
- **Non-goals**
  - 任何 store 写操作（Edit / 实施 / 删除 / 审批）
  - 异动统计页
  - 表头真实排序逻辑
  - 后端 API

## Decisions（探索阶段已确认）

- 数据范围：**全部非 Draft**
- 导出格式：**xlsx**（与专业信息一致）
- 搜索收起：**首版要**（双行布局，默认展开）
- 列排序：**首版仅 UI 装饰**（§9 已移除 sortable 装饰）

---

## §7 搜索：专业代码替换异动原因（增量）

与审批 / 维护 / 统计四模块搜索对齐：首行 **异动原因 → 专业代码**（紧挨学年学期）；展开行学号/姓名不变。

| 变更 | 说明 |
|------|------|
| 删除 | 首行「异动原因」搜索 |
| 新增 | **专业代码** 文本搜索 |
| 过滤 | `filterQueryBySearch`：`programmeCode` 替换 `movementReason` |

表格异动原因列不变；仅搜索区变更。

---

## §8 搜索增加异动类型（增量）

产品图示：首行 **状态** 旁增加 **异动类型** 下拉，与表格「异动类别」列语义一致。

### 查询搜索（本 change）

| 变更 | 说明 |
|------|------|
| 新增 | **异动类型** 下拉（全部 / 转专业 / 休学 / 复学 / 退学），紧挨状态 |
| 首行字段 | 学年学期、专业代码、状态、异动类型 |
| 过滤 | `filterQueryBySearch`：`movementType` 精确匹配 `row.sourceKey` |

### Decisions（§8 已确认）

| 项 | 决策 |
|----|------|
| 控件 | select，非文本 |
| 选项 value | `programme-transfer` / `deferment` / `resumption` / `withdrawal` |
| 选项 label | 复用 `menu.srProgrammeTransfer` 等 |
| Export | 不受异动类型字段影响（仅列表过滤） |

---

## §9 列表 UI 与维护对齐（增量）

查询页主要检索维护同源数据；列表展示、脱敏与 Y/N 规则应与 `add-movement-maintenance` §8 一致。Export 在默认列基础上额外提供可选扩展字段；移除表头 sortable 装饰。

### 列表表格（与维护 §8 同结构）

| 变更 | 说明 |
|------|------|
| 列精简 | 移除 CGPA、English、异动编号、Remark；列表不展示 Current/New School、Current/New Programme Code、New Programme Name |
| 列顺序 | 对齐维护：… → 异动日期 → Passport/IC → Student Type → Intake → 申请/生效学期 → 类别 → 原因 → 预计毕业 → Actions |
| Passport/IC | 列表脱敏（`maskPassportIc`） |
| 是否实施 | **Y/N**（`formatImplementedYn`），非 Pending/Implemented 文案 |
| 表头 | **移除** sortable class 与 ↑↓ 装饰 CSS |

### 三端一致（列表 / Export 默认 / Details）

| 端 | 规则 |
|----|------|
| 列表 | 17 列精简表；脱敏 + Y/N |
| Export 默认勾选 | 与 `movementMaintenanceExportColumnMeta` 相同（16 项）；`implementedAsYn: true`、`maskPassport: true` |
| Details | `MovementApprovalReviewView` 传 `:mask-sensitive-fields="true"`；校/专业字段仍在详情内完整展示 |

### Export 额外可选列（仅查询）

在维护 Export 默认列之外，`movementQueryExportFields.js` 追加以下 **selectedByDefault: false** 可选字段：

- `currentSchool`、`currentProgrammeCode`、`newSchool`、`newProgrammeCode`、`newProgrammeName`
- `englishName`、`cgpa`、`movementNumber`、`remark`

列表不展示上述列；用户可在 ExportModal 勾选后导出。

### Decisions（§9 已确认）

| 项 | 决策 |
|----|------|
| 与维护对齐 | 列表列集、顺序、脱敏、Y/N 与维护 §8 一致 |
| 详情脱敏 | 查询 Details 启用 `maskSensitiveFields`（撤销首版「查询详情不脱敏」） |
| Export 默认 | 复用维护 export meta 默认勾选策略 |
| Export 扩展 | 9 个详情级可选列，默认不勾选 |
| sortable | 移除（查询与维护均无假排序装饰） |

---

## §10 状态 Badge 与申请页一致（增量）

与 `add-movement-maintenance` §9 同规则：查询列表 Status 列与四 Tab 申请页 pill 标签色板一致；支持 `Expired`。

| 项 | 说明 |
|----|------|
| CSS | 复用 `movement-status-badge.css`（§9 已更新为 pill） |
| View | `MovementQueryView` import CSS + `listStatusBadgeClass`；移除 scoped 白字覆盖 |
| Expired | `status === 'Expired'` → `status-expired` |

### Decisions（§10 已确认）

| 项 | 决策 |
|----|------|
| 与申请对齐 | 色板 + pill 圆角 |
| Expired | 是 |
