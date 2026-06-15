## Why

学籍应用壳层、Student Profile、Programme Transfer 与 Deferment（休学）已落地，**Resumption（复学）** Phase 1 首版采用简化 3 态（Pending / Approved / Rejected）。产品要求复学与转专业、休学 **统一流转状态语义** 及 **流程日志外置交互**，以支撑完整业务演示：草稿编辑、审批中撤销、打回修改、终态只读、每态 Mock 样例。

## What Changes

### Phase 1（已交付 — 复学基础页 + 中英文 i18n）

- **Resumption History** 列表页：搜索首行、9 列表格、状态徽章、分页
- **Resumption Application** Form Modal（Section I–II、Supporting Documents、双声明、蓝底 Note）
- **Details** Modal、Student Profile 联动
- **`resumption.*` i18n**（en / zh / zh-flat）
- 注册 `sr-resumption`

> 首版实现为简化 Pending 审批流；Phase 2 起升级为与转专业/休学一致的 **6 态状态机**。

### Phase 2（增量 — 6 态状态机 + 每状态 2 条 Mock）

明确 **6 种核心业务状态**及允许操作（Status 由流程驱动，非手动下拉）：

| 状态 | 含义 | 允许操作 |
|------|------|----------|
| **Draft** | 学生提交前 | Edit、Delete、Save Draft、Submit |
| **In Progress** | 学生提交后，审批尚未完成 | Details；`Pending Review` 阶段可 **Cancel**（→ Cancelled）；审批已开始后不可 Cancel；管理员审批 |
| **Cancelled** | 学生在审批开始前撤销申请 | Details 只读；**流转日志**；不可 Edit / Delete / Resubmit |
| **Update Required** | 审批驳回要求修改 | Edit、Resubmit（→ In Progress / Pending Review） |
| **Rejected** | 任意审批节点不通过，流程终止 | Details 只读；**流转日志**；不可 Edit / Resubmit |
| **Approved** | 终审通过 | Details 只读；**流转日志**；归档 |

- **状态徽章**：Draft、In Progress、Update Required、Approved、Rejected、Cancelled
- **列表 Actions**（按状态显隐 + **各状态均含流转日志**）：
  - Draft：Details · Edit · Delete · 流转日志
  - In Progress（Pending Review）：Details · Cancel · 流转日志
  - In Progress（审批已开始）：Details · 流转日志
  - Update Required：Details · Edit · 流转日志
  - Cancelled / Rejected / Approved：Details · 流转日志
- **表单 Modal** 升级为 Create / Edit 共用：
  - Footer：**Close** · **Save Draft** · **Submit** / **Resubmit**（按模式切换）
  - 保留双声明 checkbox + 蓝底 Note
- **审批流**（对齐 `defermentApproval.js` / `programmeTransferApproval.js`）：
  - 阶段：`Pending Review` → `Academic Affairs` → `Approved`
  - 动作：`Approved`（推进/终审）、`Update Required`、`Rejected`（Rejected 需 comment）
- **`initialResumptions` 上述 6 种状态各 ≥2 条 mock**（共 ≥12 条），须覆盖：
  - **Draft ×2**、**In Progress ×2**（含可 Cancel + 不可 Cancel）、**Cancelled ×2**、**Update Required ×2**、**Rejected ×2**、**Approved ×2**
- 业务规则：同一 `studentId` 同时仅允许一条非终态申请（Draft / In Progress / Update Required）

### Phase 3（增量 — 流程日志外置）

- **详情 Modal** 移除内嵌 `approvalLog` 时间线；In Progress 审批区保留
- **列表 Actions** 每行、**各状态均显示** **流转日志**（`common.workflowLog`）
- 复用 **`ApprovalLogModal.vue`**（与转专业/休学/退学四模块统一）
- i18n：`common.workflowLog`（EN Workflow Log / ZH 流转日志）

### Non-goals（本变更不包含）

- Family Info 等其他学籍异动菜单
- Expired 超期双 mock（可选后续）
- 休学 DEF 记录自动回填 Deferment Semester（后续 enhancement）
- 真实后端 API、文件存储、角色权限
- 独立复学审批菜单页
- 审批通过后回写 Student Profile
- Import / Export Excel
- vue-router 引入

## Capabilities

### New Capabilities

- `resumption-app`: 复学学籍异动——Resumption History 列表、Section I–II 表单（Draft / Submit / Resubmit）、双声明 + Supporting Documents、**6 态状态机**、多段审批流、Student Profile 联动、流转日志外置、中英文 i18n

### Modified Capabilities

- `student-records-app`: 将 `sr-resumption` 升级为已开发页面；复学列表纳入四模块流转日志统一交互

## Impact

- **Phase 1 已新增/修改**
  - `ResumptionView.vue`、`ResumptionFormModal.vue`、`ResumptionDetailModal.vue`
  - `resumptions.js`、`resumptionApproval.js`
  - `studentRecordsMenu.js`、`App.vue`、i18n
- **Phase 2 修改文件**
  - `src/data/resumptions.js` — 6 态 status、helper、状态变更函数、`initialResumptions` 扩展至 ≥12 条（RES003–RES014）
  - `src/data/resumptionApproval.js` — 多段 `STAGE_FLOW`、Update Required / Rejected
  - `ResumptionFormModal.vue` — Save Draft / Edit / Resubmit
  - `ResumptionView.vue` — 状态驱动 Actions（Edit / Delete / Cancel）
  - `ResumptionDetailModal.vue` — In Progress 审批区
  - `src/i18n/locales/zh.js`、`en.js`、`zh-flat.js` — 6 态徽章与操作文案
- **Phase 3 修改/复用文件**
  - **复用** `src/components/studentRecords/ApprovalLogModal.vue`
  - **修改** `ResumptionView.vue`、`ResumptionDetailModal.vue` — 流转日志外置
- **复用**
  - `DefermentView` / `DefermentFormModal` / `DefermentDetailModal` 6 态模式（改字段与 9 列表格）
  - `list-page-search.css`、`.page-card`、`.data-table`、`.status-badge`、`TablePagination`、`ConfirmDialog`
  - `students.js` — Student ID 联动
- **无后端依赖**：纯前端 mock + 内存 CRUD
