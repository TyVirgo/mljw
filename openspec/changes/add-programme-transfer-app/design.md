## 背景说明

`add-student-records-app` 已交付学籍应用壳层与扁平 6 项菜单；`add-student-profile-crud` 已交付 Student Profile 完整 CRUD。当前 `sr-programme-transfer` 仍走 `UnderConstructionView`。

项目内可参考模式：

- **列表 CRUD**：`StudentProfileView.vue`、`LecturerInformationView.vue`
- **审批状态机**：`courseApplications.js` + `courseApproval.js`（`In Progress` / `Update Required` / `Rejected` / `approvalLog` / `STAGE_FLOW`）
- **Student 联动**：`students.js` 嵌套模型 + `normalizeStudent`

原型要求：Application History 列表 + 多 Section 申请表单（非 Profile 七 Tab Drawer）+ 7 种业务状态（非 Status 下拉）。

## 目标 / 非目标

**目标：**

- Programme Transfer 列表页：搜索、分页、状态徽章、进行中/已归档筛选
- 多 Section Form Modal（Create/Edit）与 Details Modal（只读 + 审批）
- 7 状态状态机 + 3 段审批流 + `approvalLog`
- Student ID 选择联动 Profile 自动填充 Section I/II Current 字段
- Draft/Update Required 完整编辑；Cancel/Resubmit/Delete 等状态驱动操作
- 注册 `sr-programme-transfer` 为已开发页面

**非目标：**

- 其他学籍异动菜单（Deferment、Withdrawal 等）
- 后端 API、真实文件上传、角色权限
- 独立审批菜单页（首版嵌 Details）
- 终审通过后回写 Student Profile programme
- Import/Export Excel
- 真实 cron Expired（mock 演示入口即可）

## 设计决策

### 1. 数据模型 — `src/data/programmeTransfers.js`

```javascript
{
  id: number,
  applicationId: string,           // TRF001
  studentId: string,
  type: 'Programme Transfer',

  status: 'Draft' | 'In Progress' | 'Update Required'
        | 'Approved' | 'Rejected' | 'Cancelled' | 'Expired',
  approvalStage: 'Pending Review' | 'Academic Affairs' | 'Dean/HoP' | 'Approved' | '--',
  archived: boolean,

  submittedAt: string | null,
  cancelledAt: string | null,
  expiredAt: string | null,
  applicationDeadline: string,     // ISO date，Expired 判定
  targetSemester: string,          // Start Semester

  // Section I
  fullName, nricPassport, nationality, email, contactNo, visaExpiryDate,

  // Section II
  currentProgramme, currentIntake, currentSchool,
  newProgrammeFirstChoice, newProgrammeSecondChoice,
  startSemester, transferReason,

  // Section III
  declarationAgreed: boolean,

  // Section IV
  attachment: { fileName: string, size: number } | null,

  // Section VII (admin)
  adminNewProgramme, adminNewIntake, adminDate,

  approvalLog: ApprovalLogEntry[],

  // 列表投影（normalize 派生）
  name, oldProgramme, newProgramme, applicationDate,
}
```

**列表 `newProgramme`**：优先 `adminNewProgramme`（已填），否则 `newProgrammeFirstChoice`。

**`archived`**：`Approved` | `Rejected` | `Cancelled` | `Expired` 时为 `true`。

**替代方案**：Update Required 回写为 Draft（如 Course Change）— rejected，用户要求 Update Required 为独立可见状态。

### 2. 状态机与权限 helper

| Status | 可 Edit | 可 Delete | 可 Cancel | 可 Resubmit | 可审批 |
|--------|---------|-----------|-----------|-------------|--------|
| Draft | ✓ | ✓ | — | — | — |
| In Progress (Pending Review) | ✗ | ✗ | ✓ | — | ✓ |
| In Progress (审批已开始) | ✗ | ✗ | ✗ | — | ✓ |
| Update Required | ✓ | ✗ | ✗ | ✓ | — |
| 终态 | ✗ | ✗ | ✗ | ✗ | — |

**判定 Pending Review**：`status === 'In Progress' && approvalStage === 'Pending Review'`（`approvalLog` 无审批动作记录）。

**导出 helper**（`programmeTransfers.js`）：

- `canEditTransfer(item)` / `canDeleteTransfer(item)` / `canCancelTransfer(item)` / `canResubmitTransfer(item)` / `canApproveTransfer(item)`
- `isArchivedTransfer(item)`
- `statusBadgeClass(status)` — 7 种徽章色
- `buildStudentSnapshotFromProfile(student)` — 从 `students.js` 填充 Section I/II
- `validateTransferForm(data, mode)` — Draft 宽松 / Submit 严格
- `hasActiveTransferForStudent(studentId, list)` — 一学期一次（非终态唯一）

**状态变更函数**：

- `saveDraft` / `submitApplication` → `In Progress`, stage `Pending Review`
- `cancelApplication` → `Cancelled`, `archived: true`
- `resubmitApplication` → `In Progress`, stage `Pending Review`
- `expireApplication` → `Expired`, `archived: true`（仅 Draft / Update Required）

### 3. 审批流 — `src/data/programmeTransferApproval.js`

对齐 `courseApproval.js`：

```javascript
const STAGE_FLOW = {
  'Pending Review': { next: 'Academic Affairs', final: false },
  'Academic Affairs': { next: 'Dean/HoP', final: false },
  'Dean/HoP': { next: 'Approved', final: true },
}
```

**审批动作**：`Approved` | `Update Required` | `Rejected`

| 动作 | 结果 |
|------|------|
| Approved（非末节点） | `In Progress`, stage 前进 |
| Approved（末节点） | `Approved`, `archived: true`, Section VII 写入 |
| Update Required | `Update Required`, stage `--`, 需 comment |
| Rejected | `Rejected`, `archived: true`, stage `--` |

**Section VII 编辑窗口**：`approvalStage === 'Academic Affairs'` 且 `canApproveTransfer(item)`。

**首版审批 UI**：嵌在 `ProgrammeTransferDetailModal.vue` 底部（非独立 Review 页）。

### 4. UI 结构

```
src/views/studentRecords/ProgrammeTransferView.vue
  ├── 搜索（keyword: Student ID or Name）
  ├── Tab: 进行中 | 已归档
  ├── Toolbar: + New Application
  ├── Table + TablePagination
  └── Modals:
        ProgrammeTransferFormModal.vue   (Create/Edit)
        ProgrammeTransferDetailModal.vue (Details + Approval + Log)
        ConfirmDialog (Delete/Cancel/Resubmit)
```

**Form Modal**（`max-width: ~920px`, 可滚动）：

| Section | 字段 |
|---------|------|
| Notes | 3 条规则，蓝色 info 框 |
| I | Student ID*（searchable select）+ 自动填充只读/可编辑字段 |
| II | Current ×3 + New 1st* + New 2nd + Start Semester* + Reasons* |
| III | 声明 + checkbox* |
| IV | 文件选择 mock + Consent Letter 下载 |
| VII | 仅 Edit 模式且 Academic Affairs 节点 / Details 审批区可见 |

**Footer 按钮（按状态）**：

- Create Draft：`Cancel` | `Save Draft` | `Submit`
- Edit Update Required：`Cancel` | `Save` | `Resubmit`
- Edit Draft：同上

**Details Actions（列表行内）**：

- Draft：Details · Edit · Delete
- Update Required：Details · Edit
- In Progress（可 Cancel）：Details · Cancel
- 其余：Details

**Student ID 选择**：`<select>` 或带 filter 的下拉，选项来自 `initialStudents`；onChange 调用 `buildStudentSnapshotFromProfile`。

**New Programme 下拉**：mock 选项列表（可从现有 programme mock 或硬编码 5–8 项）。

**Start Semester 下拉**：mock 学期列表（如 `2024/09`, `2025/01`）。

### 5. 列表页布局

对齐 `StudentProfileView` / 原型：

```
.page-card
  h2 "Programme Transfer Application" 或 i18n
  .search-bar  keyword + Search
  .filter-tabs  进行中 | 已归档
  .section-title "Application History"
  .toolbar  + New Application
  .data-table  9 列 + Actions
  TablePagination
```

**Mock 样例**（≥4 条覆盖状态）：

| applicationId | studentId | status | old → new |
|---------------|-----------|--------|-----------|
| TRF001 | XMUM2309001 | In Progress (Pending Review) | SWE → CS |
| TRF002 | XMUM2309003 | Approved | IB → Finance |
| TRF003 | XMUM2309002 | Draft | Finance → CS |
| TRF004 | （任选） | Update Required | — |

### 6. 路由与菜单

**`studentRecordsMenu.js`**：

```javascript
studentRecordsDevelopedPages.add('sr-programme-transfer')
```

**`App.vue`**：

```javascript
import ProgrammeTransferView from './views/studentRecords/ProgrammeTransferView.vue'
const isProgrammeTransfer = computed(() => currentPageId.value === 'sr-programme-transfer')
// template: ProgrammeTransferView v-if="isProgrammeTransfer"
```

### 7. i18n

新增 namespace `programmeTransfer.*`：

- 页面标题、Section 标题、字段标签、Notes 三条、声明文案
- 状态：`Draft` / `In Progress` / `Update Required` / `Approved` / `Rejected` / `Cancelled` / `Expired`
- 操作：Save Draft、Submit、Cancel、Resubmit、Approve 等
- 校验错误文案

`zh-flat.js` 同步状态 key（`Update Required` →「需修改」）。

### 8. 文件影响

```
新增:
  src/data/programmeTransfers.js
  src/data/programmeTransferApproval.js
  src/views/studentRecords/ProgrammeTransferView.vue
  src/components/studentRecords/ProgrammeTransferFormModal.vue
  src/components/studentRecords/ProgrammeTransferDetailModal.vue

修改:
  src/config/studentRecordsMenu.js
  src/App.vue
  src/i18n/locales/zh.js, en.js, zh-flat.js
```

## 风险与应对

| 风险 | 缓解 |
|------|------|
| Form Modal 字段多、滚动长 | Section 灰条标题分区；Modal 固定高度 + 内部 scroll |
| 审批与 Course 模块状态命名混用 | Programme Transfer 独立 helper；Update Required 不回写 Draft |
| Student 联动字段与 Category 差异 | `buildStudentSnapshotFromProfile` 内按 category 选 ic/passport |
| Expired 无真实定时 | mock 按钮或 dev 工具函数 + deadline 字段演示 |
| Section VII 与学生填写的 New Programme 混淆 | 列表展示优先 admin 字段；Details 分区只读展示 |

## 迁移说明

1. 新增 data 层与组件（不影响现有 Profile）
2. 扩展 `developedPages` 与 `App.vue` 注册
3. 手动冒烟：菜单切换、CRUD 全状态路径、审批 mock
4. 回滚：从 `developedPages` 移除 `sr-programme-transfer` 即可恢复建设中页

## 待定问题

1. 审批阶段名称是否与教务最终流程一致（当前暂定 Academic Affairs → Dean/HoP）
2. Consent Letter 静态文件路径（首版可用占位下载或空 blob）
3. 是否在后续 change 拆独立 `ProgrammeTransferReviewView`
4. localStorage 持久化转专业列表（首版可选，与 students 一致即可）

## Phase 2 — 列表搜索区与 Form Section VII UI

### 18. 列表页 — 移除大标题，首行搜索

**现状**：`ProgrammeTransferView` 含 `<h1 class="page-title">` + 独立 searchLabel「Search:」。

**目标布局**（对齐图示1 + Student Profile `.search-bar`）：

```
┌─────────────────────────────────────────────────────────────┐
│ Student ID or Name: [________]          [Search] [Reset]   │  ← 首行
│ [进行中] [已归档]                                              │
│ Application History                        [+ New Application]│
│ ┌─ table ─────────────────────────────────────────────────┐ │
└─────────────────────────────────────────────────────────────┘
```

**决策**：
- 删除 `.page-title`；模块名称仍由顶栏/面包屑 `menu.srProgrammeTransfer` 展示
- 搜索项 label 使用 `programmeTransfer.searchFieldLabel`（如 `Student ID or Name:`），**不再**使用泛化 `Search:`
- placeholder 使用 `common.pleaseInput` 或留空；label 已描述字段含义
- CSS 复用 Student Profile：`search-row` + `search-fields` + `search-actions` 同行

### 19. Form Modal — Section VII 常显（图示2）

**现状**：Section VII 仅 `canEditSectionSeven(item)` 时显示。

**目标**：
- Create / Edit 表单在 Section IV 之后**始终**渲染 Section VII
- 布局：
  - Row1：`New Programme :` 下拉（placeholder Select Programme）| `New Intake :` 下拉（Select Intake）
  - Row2：`Date :` DatePicker（Please Select）
- Create/Edit 时字段可编辑（mock 演示）；Submit 校验**不**强制 Section VII（保持原 spec）
- Details Modal 保持现有只读/审批节点可编辑逻辑

**i18n 新增**：
- `programmeTransfer.searchFieldLabel`
- `programmeTransfer.fields.selectProgramme` / `selectIntake`（placeholder）

### 20. 文件影响（Phase 2）

```
修改:
  src/views/studentRecords/ProgrammeTransferView.vue
  src/components/studentRecords/ProgrammeTransferFormModal.vue
  src/i18n/locales/zh.js, en.js
```

## Phase 3 — 状态机演示 Mock（每状态 2 条）

### 21. 状态定义（产品确认）

与 Phase 1 一致，本 Phase **固化**以下 6 态及操作边界：

| Status | 触发 | 列表 Actions | 归档 |
|--------|------|--------------|------|
| Draft | Save Draft / 新建未提交 | Details · Edit · Delete | 否 |
| In Progress | Submit / Resubmit | Details · Cancel（仅 Pending Review） | 否 |
| Cancelled | Cancel（Pending Review） | Details | 是 |
| Update Required | 审批 Update Required | Details · Edit | 否 |
| Rejected | 审批 Rejected | Details | 是 |
| Approved | 终审 Approved | Details | 是 |

**Cancel 规则**：仅 `status === 'In Progress' && approvalStage === 'Pending Review'` 且 `approvalLog` 尚无审批决策时可 Cancel；Cancel 后 **不删除记录**，变为 Cancelled 只读。

**Update Required**：允许 Edit 全部申请人 Section，Resubmit 后回到 In Progress + Pending Review。

### 22. Mock 矩阵（≥12 条 + 可选 Expired）

| applicationId | status | approvalStage | 演示要点 |
|---------------|--------|---------------|----------|
| TRF003 | Draft | -- | 空字段草稿 |
| TRF006 | Draft | -- | 部分填写草稿 |
| TRF001 | In Progress | Pending Review | 可 Cancel |
| TRF007 | In Progress | Pending Review | 可 Cancel（不同学生） |
| TRF008 | In Progress | Academic Affairs | 不可 Cancel，可审批 |
| TRF009 | In Progress | Dean/HoP | 不可 Cancel，终审前 |
| TRF010 | Cancelled | -- | 学生撤销样例 1 |
| TRF011 | Cancelled | -- | 学生撤销样例 2 |
| TRF004 | Update Required | -- | 教务打回 |
| TRF012 | Update Required | -- | 院长打回 |
| TRF013 | Rejected | -- | Pending Review 拒绝 |
| TRF014 | Rejected | -- | Academic Affairs 拒绝 |
| TRF002 | Approved | Approved | 终审通过 1 |
| TRF015 | Approved | Approved | 终审通过 2 |
| TRF005 | Expired | -- | （保留）超期演示 |

**学生 ID 约束**：非终态同一 `studentId` 仅一条；终态可重复 studentId 用于演示。

### 23. 文件影响（Phase 3）

```
修改:
  src/data/programmeTransfers.js   — initialProgrammeTransfers 扩展
  openspec/changes/add-programme-transfer-app/tasks.md — Phase 3 任务项
```

## Phase 4 — 流程日志外置（已实现）

### 27. UI 变更

- 列表每行 Actions 增加 **流转日志**（不区分 Draft/Pending/终态）
- `ApprovalLogModal` 独立展示原 Detail 内 log 表格
- Detail Modal 删除 log section；审批操作区不变

### 28. 四模块一致性

Deferment / Resumption / Withdrawal 与 Programme Transfer 共用 `ApprovalLogModal` 与 `common.workflowLog`。

### 29. 文件影响（Phase 4）

```
新增:
  src/components/studentRecords/ApprovalLogModal.vue

修改:
  ProgrammeTransferView.vue + ProgrammeTransferDetailModal.vue
  DefermentView.vue + DefermentDetailModal.vue
  ResumptionView.vue + ResumptionDetailModal.vue
  WithdrawalView.vue + WithdrawalDetailModal.vue
  src/i18n/locales/en.js, zh.js
```
