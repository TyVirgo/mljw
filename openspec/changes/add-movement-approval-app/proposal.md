## Why

`restructure-student-records-navigation` 已将 **学籍异动申请** 与 **学籍异动审批** 拆分为独立菜单；`update-movement-application-details` 已将四异动申请详情改为只读（审批 UI 从申请侧移除）。

侧边栏 **学籍异动审批**（`sr-movement-approval`）仍为建设中占位页，审批能力无处承载。产品原型要求：统一审批工作台、共性列表字段、按审批人视角三 Tab（Submitted / Pending / History），审批针对同一份申请内容，异构字段进 View 详情。

## What Changes

### 学籍异动审批列表页（`MovementApprovalView`）

- 注册 `sr-movement-approval` 至 `studentRecordsDevelopedPages` 与 `App.vue`
- **三 Tab**（审批人视角）：
  - **Submitted**：学生已提交，流程尚未到当前用户节点 → 不可批；View = 只读
  - **Pending**：轮到当前用户审批 → 可批量 Approve；View = 审批页（申请只读 + 审批操作）
  - **History**：当前用户已审批过；或学生 **Cancelled** → View = 只读，满足条件时 **Recall**
- **搜索区**：Academic Session、异动原因、Status、Student ID、Student Name（Search / Reset / 收起）
- **工具栏**：Approve（仅 Pending Tab）、Export
- **统一表格**（四异动共性列）：
  - 勾选、序号、Status、审批环节、是否实施、Student ID、Student Name、申请 Session、生效 Session、异动类别、异动原因
  - Actions：**View | Approval log**（复用 `ApprovalLogModal`）
- 数据源：合并 `programmeTransfers`、`deferments`、`resumptions`、`withdrawals` 四条 store

### 审批详情（View 行为）

- **Submitted / History（只读）**：展示与申请侧一致的只读申请内容（复用 `*DetailModal` 只读区块或 embed）
- **Pending（审批）**：同上 + 审批区（Action / Comment / Submit）；转专业含 **Section VII** 教务字段
- **History + Recall**：撤回本人上一笔 Approved，且下一节点尚未审批（mock 规则）

### 审批流程引擎（mock）

- 按 **异动类别** + **studentCategory**（Local vs China/International）加载 workflow
- 休学 / 复学 / 退学：对齐产品流程图（含 ISAO 等分支；首版并行节点可 **串行化** demo）
- 转专业：沿用 AC → Academic Affairs → Dean/HoP → Approved，终审填 Section VII
- 扩展 `approvalStage` 节点名；`approvalLog` 记录 actor / stage / action
- Mock **当前审批角色**（Header 或页内下拉）用于 Submitted / Pending / History 分桶演示

### 与申请侧关系

- 申请 Tab：Create / Edit / Cancel / Resubmit / 流转日志；Details 只读
- 审批页：推进 `status` / `approvalStage` / `approvalLog`；写回对应 data store
- `*Approval.js` 逐步收敛为统一 `movementApprovalEngine.js`（或各 type 注册 workflow）

## Capabilities

### New Capabilities

- `movement-approval-app`：学籍异动审批统一列表、三 Tab 分桶、View/Recall、批量审批、四异动 workflow mock

### Modified Capabilities

- `student-records-app`：`sr-movement-approval` 升级为已开发页面；与申请 Tab 职责分离

## Impact

- **新增**
  - `src/views/studentRecords/MovementApprovalView.vue`
  - `src/components/studentRecords/MovementApprovalDetailPanel.vue`（或 Modal）
  - `src/components/studentRecords/MovementApprovalModal.vue`（批量审批，参考 `CourseApprovalModal`）
  - `src/data/movementApprovalQueue.js` — 四源归一化、Tab 过滤、搜索
  - `src/data/movementApprovalWorkflows.js` — 流程定义
  - `src/data/movementApprovalEngine.js` — apply decision / recall / classify bucket
- **修改**
  - `src/data/*Approval.js` 或 mock 数据 — 扩展 stage、session、implemented 字段
  - `src/config/studentRecordsMenu.js`、`App.vue`
  - `src/i18n/locales/zh.js`、`en.js`
- **复用**
  - `CourseApprovalView` 列表壳层模式
  - `ApprovalLogModal.vue`、`MovementAttachmentReadonly.vue`、各 `*DetailModal` 只读结构

## Non-goals

- 真实 RBAC / 多用户会签 UI（首版 mock 角色切换）
- 并行会签完整实现（v1 可串行化节点）
- 回写 Student Profile 学籍字段
- vue-router、真实后端 API
- 异动类别 / 维护 / 查询 / 统计菜单
