## Why

学籍应用壳层（`add-student-records-app`）与 Student Profile 完整 CRUD（`add-student-profile-crud`）已落地，但侧边栏 **Programme Transfer（转专业）** 仍为建设中占位页。转专业是学籍异动核心场景之一，需按 StudentSys 原型提供 **申请历史列表**、**多 Section 申请表单** 及 **带审批流的状态管理**（Draft → 审批 → 终态），以支撑业务演示并与现有 Course Application 审批模式保持一致。

## What Changes

- 新增 **Programme Transfer Application** 列表页（Application History）：
  - 搜索：Student ID or Name
  - 工具栏：`+ New Application`
  - 表格列：Application ID、Student ID、Name、Type、Old Programme、New Programme、Status、Date、Actions
  - 状态徽章（非下拉）：Draft、In Progress、Update Required、Approved、Rejected、Cancelled、Expired
  - 列表筛选：进行中 / 已归档（Tab 或等效筛选）
- 新增 **PROGRAMME TRANSFER APPLICATION** 宽屏 Form Modal（Create / Edit 共用）：
  - Notes 说明区（3 条规则）
  - Section I：Student Details（Student ID 可搜索选择，联动 `students.js` 自动填充）
  - Section II：Programme Transfer Information（Current Programme / Intake / School；New Programme 1st/2nd Choice；Start Semester；Reasons）
  - Section III：Declaration（声明文案 + 必选 checkbox）
  - Section IV：Supporting Documents（附件上传 mock；Download Consent Letter）
  - Section VII：For Academic Affairs Office Only（New Programme / New Intake / Date；审批节点可编辑）
- 新增 **Details** 只读 Modal/Drawer：展示全部 Section；**审批 log 外置**至列表「流转日志」按钮（见 Phase 4）
- 实现 **状态驱动 CRUD**（Status 由操作变更，非手动下拉）：
  - **Draft**：Save Draft、Submit、Edit、Delete
  - **In Progress**（Pending Review）：Details、Cancel（学生撤销，归档）
  - **In Progress**（审批已开始）：Details；管理员审批动作
  - **Update Required**：Edit、Resubmit
  - **Approved / Rejected / Cancelled / Expired**：Details 只读，归档
- 新增 mock 审批流（对齐 `courseApproval.js` 模式）：
  - 阶段：Pending Review → Academic Affairs → Dean/HoP → Approved
  - 动作：Approve（推进/终审）、Update Required、Rejected
- 业务规则：同一 `studentId` 同时仅允许一条非终态申请；Draft/Update Required 超期可变为 Expired（mock 演示）
- 注册 `sr-programme-transfer` 至 `studentRecordsDevelopedPages` 与 `App.vue`
- 补充 i18n（中英文）

### Phase 2（增量 — 列表搜索区与新建表单 Section VII UI 对齐原型）

- **列表页**：移除页面内大标题（`Programme Transfer Application`）；`.page-card` **首行即为搜索区**
- **搜索区格式**：采用「搜索字段描述 + 搜索框」——标签文案与输入含义一致（如 `Student ID or Name:` + 输入框），Search / Reset 按钮同行右对齐；对齐 Student Profile / Basic Data 搜索栏模式
- **新建/编辑表单**：在 Section IV 之后**始终展示 Section VII**（图示2），布局与原型一致：
  - 灰条标题 `SECTION VII : FOR ACADEMIC AFFAIRS OFFICE USE ONLY`
  - 第一行：New Programme（Select Programme）、New Intake（Select Intake）
  - 第二行：Date（Please Select）
  - Create 时 Section VII 可见（首版可选填，Submit 不强制校验；终审/教务节点再必填）

### Phase 3（增量 — 状态机演示 Mock 补齐，每状态 2 条）

明确 6 种核心业务状态及允许操作（Status 由流程驱动，非手动下拉）：

| 状态 | 含义 | 允许操作 |
|------|------|----------|
| **Draft** | 学生提交前 | Edit、Delete、Save Draft、Submit |
| **In Progress** | 学生提交后，审批尚未完成 | Details；`Pending Review` 阶段可 **Cancel**（→ Cancelled）；审批已开始后不可 Cancel；管理员审批 |
| **Cancelled** | 学生在审批开始前撤销申请 | Details 只读；不可 Edit / Delete / Resubmit |
| **Update Required** | 审批驳回要求修改 | Edit、Resubmit（→ In Progress / Pending Review） |
| **Rejected** | 任意审批节点不通过，流程终止 | Details 只读；不可 Edit / Resubmit |
| **Approved** | 终审通过 | Details 只读；归档 |

- **`initialProgrammeTransfers` 上述 6 种状态各 ≥2 条 mock**（共 ≥12 条），须覆盖：
  - **Draft ×2**：演示 Edit / Delete
  - **In Progress ×2**：一条 `approvalStage === 'Pending Review'`（可 Cancel）；一条审批已开始（如 Academic Affairs 或 Dean/HoP，不可 Cancel）
  - **Cancelled ×2**：只读 Details
  - **Update Required ×2**：Edit + Resubmit
  - **Rejected ×2**：不同审批节点终止
  - **Approved ×2**：含 Section VII 已填样例
- 列表 Actions 与 `canEditTransfer` / `canCancelTransfer` 等 helper 与上表一致
- **Expired** 保留 Phase 1 演示能力，本 Phase 不强制双 mock

### Phase 4（增量 — 流程日志外置 + 四模块统一）

- **详情 Modal** 移除内嵌 `approvalLog` 时间线；Pending 审批区保留
- **列表 Actions** 每行增加 **流转日志**（`common.workflowLog`），**各状态均显示**
- 新增共享组件 **`ApprovalLogModal.vue`**（表格 Stage/Actor/Action/Date/Comment；副标题申请编号·学号·姓名）
- **同步落地**：Deferment、Resumption、Withdrawal 列表与详情（与转专业同一交互）
- i18n：`common.workflowLog`（EN Workflow Log / ZH 流转日志）

### Non-goals（本变更不包含）

- Family Info、Deferment、Resumption、Withdrawal 等其他学籍异动菜单
- 真实后端 API、文件存储、权限/角色体系（首版 Admin 演示身份可审批）
- 独立「转专业审批」菜单页（首版审批嵌在 Details 内，后续可拆）
- 终审通过后回写 Student Profile 的 programme 字段
- Import / Export Excel（原型未要求）
- vue-router 引入
- 真实定时任务触发 Expired（首版提供 mock/演示入口）

## Capabilities

### New Capabilities

- `programme-transfer-app`: 转专业学籍异动——申请列表、多 Section 表单、状态机、审批流、Student Profile 联动、归档筛选

### Modified Capabilities

- `student-records-app`: 将 `sr-programme-transfer` 从建设中页升级为已开发页面（`studentRecordsDevelopedPages` 扩展）

## Impact

- **新增文件**
  - `src/views/studentRecords/ProgrammeTransferView.vue` — 列表页
  - `src/components/studentRecords/ProgrammeTransferFormModal.vue` — 多 Section 表单
  - `src/components/studentRecords/ProgrammeTransferDetailModal.vue` — 详情 + 审批
  - `src/data/programmeTransfers.js` — 数据模型、mock、状态/权限 helper
  - `src/data/programmeTransferApproval.js` — 审批阶段与决策逻辑
- **Phase 2 修改文件**
  - `src/views/studentRecords/ProgrammeTransferView.vue` — 移除 page-title；搜索栏首行 + 标签格式
  - `src/components/studentRecords/ProgrammeTransferFormModal.vue` — Section VII 常显 + 布局对齐图示2
  - `src/i18n/locales/zh.js`、`en.js` — 搜索标签、Section VII placeholder 文案（如 Select Programme）
- **Phase 3 修改文件**
  - `src/data/programmeTransfers.js` — 扩展 `initialProgrammeTransfers` 至 6 状态各 2 条；更新 `nextId` / `nextAppSeq`
  - （可选）`ProgrammeTransferView.vue` — 冒烟注释或 Tab 筛选确认各状态可见
- **Phase 4 修改/新增文件**
  - **新增** `src/components/studentRecords/ApprovalLogModal.vue`
  - **修改** 四模块 `*View.vue` — Actions 流转日志 + 弹窗状态
  - **修改** 四模块 `*DetailModal.vue` — 移除内嵌 log
  - **修改** `src/i18n/locales/en.js`、`zh.js` — `common.workflowLog`
- **复用**
  - `StudentProfileView` 列表壳层模式（`.page-card`、搜索、分页、`ConfirmDialog`）
  - `courseApproval.js` / `courseApplications.js` 审批状态与 `approvalLog` 模式
  - `students.js` — Student ID 联动只读引用
- **无后端依赖**：纯前端 mock + localStorage（可选持久化，与现有 data 层一致）
