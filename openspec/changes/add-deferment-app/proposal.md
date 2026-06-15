## Why

学籍应用壳层与 Student Profile、Programme Transfer 已落地，但侧边栏 **Deferment（休学）** 首版采用简化 3 态（Pending / Approved / Rejected）。产品要求休学与转专业 **统一流转状态语义** 及 **流程日志外置交互**，以支撑完整业务演示：草稿编辑、审批中撤销、打回修改、终态只读、每态 Mock 样例。

## What Changes

### Phase 1–2（已交付 — 休学基础页 + 中英文 i18n）

- **Deferment History** 列表页：搜索首行、10 列表格、状态徽章、分页
- **Deferment** 多 Section Form Modal、Details Modal、Student Profile 联动
- **`deferment.*` i18n**（en / zh / zh-flat）、`getMainReasonLabel`
- 注册 `sr-deferment`

> 首版实现为简化 Pending 审批流；Phase 3 起升级为与转专业一致的 **6 态状态机**。

### Phase 3（增量 — 6 态状态机 + 每状态 2 条 Mock）

明确 **6 种核心业务状态**及允许操作（Status 由流程驱动，非手动下拉）：

| 状态 | 含义 | 允许操作 |
|------|------|----------|
| **Draft** | 学生提交前 | Edit、Delete、Save Draft、Submit |
| **In Progress** | 学生提交后，审批尚未完成 | Details；`Pending Review` 阶段可 **Cancel**（→ Cancelled）；审批已开始后不可 Cancel；管理员审批 |
| **Cancelled** | 学生在审批开始前撤销申请 | Details 只读；**流转日志**；不可 Edit / Delete / Resubmit |
| **Update Required** | 审批驳回要求修改 | Edit、Resubmit（→ In Progress / Pending Review） |
| **Rejected** | 任意审批节点不通过，流程终止 | Details 只读；**流转日志**；不可 Edit / Resubmit |
| **Approved** | 终审通过 | Details 只读；**流转日志**；归档 |

- **状态徽章**：Draft、In Progress、Update Required、Approved、Rejected、Cancelled（对齐转专业 / `zh-flat.js`）
- **列表 Actions**（按状态显隐 + **各状态均含流转日志**）：
  - Draft：Details · Edit · Delete · 流转日志
  - In Progress（Pending Review）：Details · Cancel · 流转日志
  - In Progress（审批已开始）：Details · 流转日志
  - Update Required：Details · Edit · 流转日志
  - Cancelled / Rejected / Approved：Details · 流转日志
- **表单 Modal** 升级为 Create / Edit 共用：
  - Footer：**Close** · **Save Draft** · **Submit** / **Save** / **Resubmit**（按模式切换）
- **审批流**（对齐 `programmeTransferApproval.js` 模式，休学字段独立）：
  - 阶段：`Pending Review` → `Academic Affairs` → `Approved`（或精简为单段 + Update Required / Rejected / Approved）
  - 动作：`Approved`（推进/终审）、`Update Required`、`Rejected`（Rejected 需 comment）
- **`initialDeferments` 上述 6 种状态各 ≥2 条 mock**（共 ≥12 条），须覆盖：
  - **Draft ×2**：Edit / Delete 演示
  - **In Progress ×2**：一条 `Pending Review` 可 Cancel；一条审批已开始（不可 Cancel）
  - **Cancelled ×2**：只读 Details
  - **Update Required ×2**：Edit + Resubmit
  - **Rejected ×2**：不同节点终止
  - **Approved ×2**：完整 Approved log
- 业务规则：同一 `studentId` 同时仅允许一条非终态申请（Draft / In Progress / Update Required）
- **Expired**（可选）：Draft / Update Required 超期演示，本 Phase 不强制双 mock

### Phase 4（增量 — 流程日志外置）

- **详情 Modal** 移除内嵌 `approvalLog` 时间线；In Progress 审批区保留
- **列表 Actions** 每行、**各状态均显示** **流转日志**（`common.workflowLog`）
- 复用 **`ApprovalLogModal.vue`**（表格 Stage / Actor / Action / Date / Comment；副标题申请编号 · 学号 · 姓名）
- i18n：`common.workflowLog`（EN Workflow Log / ZH 流转日志）

### Non-goals（本变更不包含）

- Family Info、Resumption、Withdrawal 等其他学籍异动菜单（各自独立 change）
- 真实后端 API、文件存储、角色权限体系（首版 Admin 演示身份可审批）
- 独立「休学审批」菜单页（首版审批嵌在 Details 内）
- 审批通过后回写 Student Profile enrollment status
- Import / Export Excel
- vue-router 引入

## Capabilities

### New Capabilities

- `deferment-app`: 休学学籍异动——Deferment History 列表、多 Section 表单（Draft / Submit / Resubmit）、**6 态状态机**、多段审批流、Student Profile 联动、流转日志外置

### Modified Capabilities

- `student-records-app`: 将 `sr-deferment` 从建设中页升级为已开发页面；休学列表纳入四模块流转日志统一交互

## Impact

- **Phase 1–2 已新增/修改**
  - `DefermentView.vue`、`DefermentFormModal.vue`、`DefermentDetailModal.vue`
  - `deferments.js`、`defermentApproval.js`
  - `studentRecordsMenu.js`、`App.vue`、i18n
- **Phase 3 修改文件**
  - `src/data/deferments.js` — 6 态 status、helper（`canEditDeferment` / `canDeleteDeferment` / `canCancelDeferment` / `canResubmitDeferment` 等）、状态变更函数、`initialDeferments` 扩展至 ≥12 条
  - `src/data/defermentApproval.js` — 多段 `STAGE_FLOW`、Update Required / Rejected
  - `DefermentFormModal.vue` — Save Draft / Edit / Resubmit 模式
  - `DefermentView.vue` — 状态驱动 Actions（Edit / Delete / Cancel / Resubmit）
  - `DefermentDetailModal.vue` — In Progress 审批区（Approve / Update Required / Reject）
  - `src/i18n/locales/zh.js`、`en.js`、`zh-flat.js` — 6 态徽章与操作文案
- **Phase 4 修改/复用文件**
  - **复用** `src/components/studentRecords/ApprovalLogModal.vue`
  - **修改** `DefermentView.vue` — 流转日志按钮 + 弹窗
  - **修改** `DefermentDetailModal.vue` — 移除内嵌 log
  - **修改** i18n — `common.workflowLog`
- **复用**
  - `ProgrammeTransferView` / `ProgrammeTransferFormModal` / `ProgrammeTransferDetailModal` 状态机与 Actions 模式
  - `list-page-search.css`、`.page-card`、`.data-table`、`.status-badge`、`TablePagination`、`ConfirmDialog`
  - `students.js` — Student ID 联动
- **无后端依赖**：纯前端 mock + 内存 CRUD
