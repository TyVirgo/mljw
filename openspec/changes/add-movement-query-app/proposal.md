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
- 列排序：**首版仅 UI 装饰**
