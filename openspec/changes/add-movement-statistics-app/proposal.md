## 背景与动机

学籍异动侧边栏「学籍异动统计」（`sr-movement-statistics`）仍为建设中页。教务人员需要按 **学院 + 专业 + Intake** 维度查看「该专业本学期各类型学籍异动人数」的**聚合透视表**（产品图示1–2），并支持与维护/查询一致的 **ExportModal + xlsx** 导出。统计页与查询/维护的明细宽表不同：一行代表一个分组，列为各异动类型计数。

## 变更内容

### 主列表页（图示1–2）

- 注册 `sr-movement-statistics` 为已开发页面
- **搜索区（双行 + 收起）** — 与查询页一致
  - 首行：Academic Session、异动原因、Status；Search / Reset / 收起
  - 次行（可收起，默认展开）：Student ID、Student Name
  - 复用 `list-page-search.css`
- **工具栏**：仅 **Export**（`ExportModal`，与维护/查询交互一致）
- **聚合宽表**（横向滚动）：
  - 行维度：序号、School Code、Programme Code、Intake
  - 计数列（图1）：Programme Transfer、Deferment、Withdrawal、Resumption、Outbound Mobility
  - 计数列（图2，横向滚动续）：Expel、Incomplete、Completion、Completion without Graduation、Inbound Mobility、IEP
- **无行操作**（无 Details / Edit / Approval log）
- 可选勾选列（供 Export 选中行）；分页器与查询/维护一致

### 数据与聚合规则

- **计入范围**：四 Tab 合并，**排除 Draft**（与查询一致，前 4 列数字可对照）
- **Academic Session 过滤**：按 **applicationSession** 过滤参与计数的申请（复用 `extractApplicationSession` 回退链）
- **分组键**：`schoolCode + programmeCode + intake`
- **前 4 列计数**：按 `sourceKey` 映射（programme-transfer / deferment / withdrawal / resumption）
- **后 7 列计数**：来自统计专用 **supplement 种子**（`movementStatisticsSeeds.js`），不写入四 Tab store，与查询/维护互不影响
- **行集合**：仅展示**至少有一列计数 > 0** 的分组（mock 目标约 6 行）

### 导出

- 复用 `ExportModal` + `useListPageI18n`：字段可选、当前页 / 全部结果 / 选中行
- 输出 **.xlsx**（模式对齐 `exportMovementQueryExcel.js` / 维护导出）
- 导出字段为统计专用（3 维度 + 11 计数列）

## 能力范围

### 新增能力

- `movement-statistics-app`: 聚合统计透视表、双行搜索收起、supplement 种子、ExportModal xlsx

### 修改的能力

- `student-records-app`: `sr-movement-statistics` 从建设中升级为已开发

## 影响范围

- **新增**
  - `MovementStatisticsView.vue`
  - `src/data/movementStatisticsQueue.js`（filter + aggregate + merge supplement）
  - `src/data/movementStatisticsSeeds.js`（后 7 列 mock 计数源）
  - `src/data/movementStatisticsExportFields.js`
  - `src/utils/exportMovementStatisticsExcel.js`
  - `resolveStatDimensions` / `SCHOOL_CODE_MAP`（可放在 queue 或 helpers）
- **修改**
  - `studentRecordsMenu.js` → `studentRecordsDevelopedPages` 加入 `sr-movement-statistics`
  - `App.vue` 挂载 `MovementStatisticsView`
  - `src/i18n/locales/en.js`、`zh.js`（`movementStatistics.*`）
- **复用**
  - `filterQueryBySearch` 逻辑（或复用 `movementQueryQueue.js` 的 filter）
  - `ExportModal`、`TablePagination`、`list-page-search.css`
  - `MovementQueryView` 搜索双行 + Export 确认流程
- **非目标**
  - 更新 PRD 文档
  - 修改四 Tab store 结构以支撑后 7 列（用 supplement 代替）
  - 行内下钻 Details / Approval log
  - 表头真实排序（首版可选 sortable 装饰，与查询一致）
  - vue-router、后端 API

## 设计决策（探索阶段已确认）

- 数据范围：**全部非 Draft**（与查询一致）
- Session 口径：**applicationSession**
- 行集合：**仅有过异动的分组**（约 6 行 mock）
- 后 7 列：**列全展示**；前 4 列真实聚合；后 7 列 **supplement 种子** 提供合理非零 mock 数值

---

## §7 搜索：专业代码替换异动原因（增量）

与审批 / 维护 / 查询四模块搜索对齐：首行 **异动原因 → 专业代码**（紧挨学年学期）。

| 变更 | 说明 |
|------|------|
| 删除 | 首行「异动原因」搜索 |
| 新增 | **专业代码** 文本搜索 |
| 过滤 | `filterQueryBySearch` + `filterStatisticsSeeds`：`programmeCode` 替换 `movementReason` |

---

## §8 菜单暂缓：隐藏学籍异动统计（增量）

本阶段 **不在侧栏展示** 学籍异动统计；已实现代码保留，后续 change 再开放菜单。

| 变更 | 说明 |
|------|------|
| 菜单 | `studentRecordsMenu.js` 移除 `sr-movement-statistics` 子项 |
| 已开发页 | `studentRecordsDevelopedPages` 移除 `sr-movement-statistics` |
| 保留 | `MovementStatisticsView.vue` 及数据层不删除 |

### 设计决策（

| 项 | 决策 |
|----|------|
| 用户可见性 | 侧栏无入口；非本阶段交付 |
| 代码 | 保留实现，便于后续恢复菜单 |
