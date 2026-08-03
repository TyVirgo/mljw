# 学籍管理-异动申请（教职工/学生端） — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-deferment-app

## 背景说明

`add-deferment-app` Phase 1–2 已交付休学列表 + 简化 Pending 审批 + 中英文 i18n。产品要求对齐 `add-programme-transfer-app` **6 态流转语义** 与 **流程日志外置**。

项目内参考：

- **状态机 + Actions**：`programmeTransfers.js` + `ProgrammeTransferView.vue`
- **审批**：`programmeTransferApproval.js`（Approved / Update Required / Rejected）
- **流转日志**：`ApprovalLogModal.vue`（Phase 4 四模块统一）

## 目标 / 非目标

**目标：**

- 6 态状态机（Draft / In Progress / Cancelled / Update Required / Rejected / Approved）
- 每状态 ≥2 条 Mock（≥12 条）
- 列表状态驱动 Actions + **各状态流转日志**
- Create / Edit Form Modal（Save Draft / Submit / Resubmit）
- Details 只读 + In Progress 内嵌审批；**不含内嵌 log**
- 对齐 Programme Transfer 交互模式

**非目标：**

- Expired 双 mock（可选保留单条演示）
- 真实后端、角色权限
- 独立审批菜单页
- 审批通过后回写 学生Profile

## 设计决策

### 1. 数据模型 — `src/data/deferments.js`

在 Phase 1 模型基础上扩展：

```javascript
{
  // ... Section I–III、attachment 等同 Phase 1 ...

  status: 'Draft' | 'In Progress' | 'Update Required' | 'Approved' | 'Rejected' | 'Cancelled',
  approvalStage: 'Pending Review' | 'Academic Affairs' | 'Approved' | '--',
  archived: boolean,
  applicationDeadline: string | null,  // 可选，Expired 演示

  approvalLog: ApprovalLogEntry[],
}
```

**`archived`**：`Approved` | `Rejected` | `Cancelled` 时为 `true`（或 `archived` 字段显式设置）。

**ACTIVE_STATUSES**：`Draft`、`In Progress`、`Update Required` — 同一 `studentId` 仅一条。

### 2. 状态机与权限 helper

| Status | 可 Edit | 可 Delete | 可 Cancel | 可 Resubmit | 可审批 | 列表 Actions |
|--------|---------|-----------|-----------|-------------|--------|--------------|
| Draft | ✓ | ✓ | ✗ | ✗ | ✗ | Details · Edit · Delete · 流转日志 |
| In Progress (Pending Review) | ✗ | ✗ | ✓ | ✗ | ✓ | Details · Cancel · 流转日志 |
| In Progress (审批已开始) | ✗ | ✗ | ✗ | ✗ | ✓ | Details · 流转日志 |
| Update Required | ✓ | ✗ | ✗ | ✓ | ✗ | Details · Edit · 流转日志 |
| Cancelled | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Rejected | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Approved | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |

**Cancel 规则**（同转专业）：仅 `status === 'In Progress' && approvalStage === 'Pending Review'` 且 log 尚无 Approved / Rejected / Update Required 决策；Cancel 后记录保留，变为 Cancelled 只读。

**导出 helper**：

- `canEditDeferment`、`canDeleteDeferment`、`canCancelDeferment`、`canResubmitDeferment`、`canApproveDeferment`
- `isArchivedDeferment`、`statusBadgeClass`
- `hasActiveDefermentForStudent(studentId, list)`
- `buildStudentSnapshotForDeferment`、`validateDefermentForm(data, mode)`（draft / submit / resubmit）
- `saveDraftApplication`、`submitApplication`、`cancelApplication`、`resubmitApplication`

### 3. 审

## 来源：add-deferment-period-dates

# 设计：休学起止时间

## 数据 lookup

```
defermentPeriod (YYYY/MM)
    → findSemesterRecordByKey (calendarInfo + initialSemesterRecords)
    → defermentStartDate / defermentEndDate (dd/MM/YYYY, 快照存申请)
```

`defermentPeriodOptions` 改为由 `initialSemesterRecords` 生成，与基础数据学年学期维护一致。

## 表单联动

- 选择/变更 `defermentPeriod` 时同步起止时间；清空期间则清空起止时间。
- 字段只读，Save Draft / Submit 时随申请持久化。

## 状态日志

Implement 时 `applyStudentProfileFromMovement(studentId, config, { sourceKey, item })`：

- 对 `deferment`：按该生已有 Deferment 日志条数 +1 生成 ordinal（1st/2nd/3rd…）
- `remarkLines` 首行：`{ordinal} Deferment: {start}-{end}`
- 保留 `Deferment Period : …`、`Reason : …`（若有）

不含 Resumption 内容。

## 来源：add-deferment-period-field-tooltip

## Tooltip 说明

- 位置：`deferment.fields.defermentPeriod` 标签旁 `?` 图标
- 交互：hover / focus 显示（与异动类别表单 field hint 一致）
- 文案（zh）：下拉数据允许选择当前申请日期之前（休学补回）和之后的休学学期

复用 `movement-form.css` 中 `.field-hint-*` 样式类。

## 来源：add-movement-declaration-parent-email-notice

## Context

Section V 已由 `movementDeclarationItems.js` 按类型输出 i18n key 列表，再由 `MovementDeclarationSection` 渲染。四类均含 `movementCommon.declaration.correct`（【通用】）。

产品图示要求在该通用句后追加家长邮件通知告知，且标注为【通用】全部申请。

## Goals / Non-Goals

**Goals:**
- 一处定义、四类复用
- 中英文齐备；条款编号自动随数组长度变化

**Non-Goals:**
- 邮件发送、家长联系人数据联动
- PDF/导出模板专项改造（若导出走同一 items，会自然带上；不做单独验证任务）

## Decisions

1. **新通用 key：`movementCommon.declaration.parentEmailNotice`**  
   放入 `commonDeclarationItems`，并让四类数组都以 `[...commonDeclarationItems, …特有条款]` 或在各数组中于 `COMMON_CORRECT` 后插入同一常量。  
   推荐：抽出 `commonDeclarationItems = [CORRECT, PARENT_EMAIL]`，四类以此为前缀，避免漏改某一类。

2. **插入位置**  
   紧接 correct 之后、类型特有条款之前（与图示「通用」语义一致）。

3. **中文文案**  
   `我知悉，家长/监护人将通过电子邮件获知本申请结果。`（与现有「我知悉…」语气对齐）

## Risks / Trade-offs

- [Risk] 历史截图与导出 PDF 若硬编码旧条款 → Mitigation：原型以页面 Section V 为准；导出若另有硬编码另开任务

## Open Questions

（无）

## 来源：add-movement-international-remarks-and-documents

## 国际学生说明（图示1）

- 位置：`MovementApplicantNotes` 正下方
- 可见性：`studentCategory === 'International'`（不含 China）
- 文案：四类异动各一套 i18n key（`internationalRemarks.*`）
- 退学：用国际说明**取代**末尾 `isaoNoteAlert`，避免重复

## 多附件（图示2）

```
movementAttachments.js
  consentLetter *（所有人）
  flightTickets *（International）
  medicalRecovery（复学，可选）
  legacy attachment ← consentLetter（兼容旧读者）
```

| 字段 | 必填 | 格式 |
|------|------|------|
| Consent Letter | 是 | pdf/jpg/png/docx，5MB |
| Flight Tickets | International 必填 | 同上 |
| Medical Recovery | 复学可选 | 同上 |

## 组件

```
MovementInternationalStudentRemarks.vue   — 表单/详情只读
MovementDocumentsUploadSection.vue        — 表单多行上传
MovementAttachmentsReadonly.vue           — 详情多行只读
```

校验错误键：`attachments.consentLetter` 等（`attachmentErrorKey`）。

## 来源：add-movement-parent-contacts-from-family

# 设计：多家长/监护人联系人

## 数据模型

```
student.family[]  ──选学生──▶  parentContacts[]  (申请快照)
                                    │
                                    ├── 表单可增删改
                                    └── withSyncedLegacyParentFields → parentGuardianName 等 (首条)
```

## 字段映射

| family | parentContacts |
|--------|----------------|
| name | name |
| relationship | relationship |
| icPassport | icPassport |
| mobilePhone | mobilePhone |
| email | email |

## 校验

- **deferment**：至少一条非空联系人；每条 name + mobilePhone 必填
- **withdrawal**：同上 + icPassport + relationship + email 必填
- 编辑过程允许 `parentContacts` 为空数组；提交时由 `validateParentContacts` 拦截

## UI（编辑）

组件：`MovementParentConsentSection.vue`

```
┌─ Parent/Guardian N ────────── [🗑] ─┐
│  form-grid：姓名/关系/证件/电话/邮箱   │
└──────────────────────────────────────┘
（可 0..N 块；N≥2 时块之间顶部分割线）
[ + 添加家长/监护人 ]
```

- 每条有联系人时均显示标题行 + 垃圾桶（含仅 1 条）
- 删除：`emit('update:contacts', next)`，可删至 `[]`
- 添加：追加 `createEmptyParentContact()`
- 空态：无表单块；可选轻量提示文案 + 添加入口
- 不二次确认

## UI（只读）

- `MovementParentConsentReadonly`：按人数重复 `detail-grid`；多位时编号 + 分割线；无增删

## 兼容

`normalizeParentContacts` 优先读非空 `parentContacts[]`，否则从 flat 字段合成单条数组。

## 来源：add-programme-transfer-app

## 背景说明

`add-student-records-app` 已交付学籍应用壳层与扁平 6 项菜单；`add-student-profile-crud` 已交付 学生Profile 完整 CRUD。当前 `sr-programme-transfer` 仍走 `UnderConstructionView`。

项目内可参考模式：

- **列表 CRUD**：`StudentProfileView.vue`、`LecturerInformationView.vue`
- **审批状态机**：`courseApplications.js` + `courseApproval.js`（`In Progress` / `Update Required` / `Rejected` / `approvalLog` / `STAGE_FLOW`）
- **学生联动**：`students.js` 嵌套模型 + `normalizeStudent`

原型要求：Application History 列表 + 多 Section 申请表单（非 Profile 七 Tab Drawer）+ 7 种业务状态（非 Status 下拉）。

## 目标 / 非目标

**目标：**

- Programme Transfer 列表页：搜索、分页、状态徽章、进行中/已归档筛选
- 多 Section Form Modal（Create/Edit）与 Details Modal（只读 + 审批）
- 7 状态状态机 + 3 段审批流 + `approvalLog`
- 学生ID 选择联动 Profile 自动填充 Section I/II Current 字段
- Draft/Update Required 完整编辑；Cancel/Resubmit/Delete 等状态驱动操作
- 注册 `sr-programme-transfer` 为已开发页面

**非目标：**

- 其他学籍异动菜单（Deferment、Withdrawal 等）
- 后端 API、真实文件上传、角色权限
- 独立审批菜单页（首版嵌 Details）
- 终审通过后回写 学生Profile programme
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

| Status | 可 Edit | 可 Delete | 可 

## 来源：add-programme-transfer-office-use-approval

# 设计
- 标签复用 `newProgrammeFirst`、`startSemester`；日期用 `adminApprovalDate`
- 下拉：`programmeOptions`、`semesterOptions`（与 Section II 一致）
- 默认：`resolveProgrammeTransferOfficeUseDefaults(item)`
- 可见：学生 mode 隐藏；approve 可编辑；非 学生且已批准只读

## 布局与样式

- 组件根节点使用 `movement-detail-body`，与 `MovementDetailContent` 上下区块共用 `movement-detail-body.css`
- 只读：`section-bar` + `detail-grid`（dt/dd），与 Section I–VI 详情一致
- 可编辑（审批）：`section-bar` + `form-grid` + `form-control`，与转专业 FormModal 字段网格一致
- 不单独定义 input/section 样式，避免 drawer 内外视觉不一致

## 来源：add-programme-transfer-status-log-remark

# 设计
## 字段映射

| 片段 | 来源 |
|------|------|
| oldCode | `currentProgramme` → 专业短代码 |
| newCode | `adminNewProgramme \|\| newProgrammeFirstChoice` |
| approved in | `applicationSession`（申请学年学期） |
| effective from | `adminNewIntake \|\| startSemester` |

## Implement 行为

PT001 `modifyStudentStatus: false`：仅追加 `statusLogs`，`status` 保持当前 enrollment（通常 Active）。

## 参考格式

`Programme transfer, SWE to DS, approved in 2025/02, effective from 2025/09`

## 来源：add-resumption-app

## 背景说明

`add-resumption-app` Phase 1 已交付复学列表 + 简化 Pending 审批 + 中英文 i18n。产品要求对齐 `add-deferment-app` Phase 3 / `add-programme-transfer-app` **6 态流转语义** 与 **流程日志外置**。

项目内参考：

- **6 态状态机**：`deferments.js` + `DefermentView.vue`（Phase 3 已落地）
- **审批**：`defermentApproval.js`（Pending Review → Academic Affairs → Approved）
- **流转日志**：`ApprovalLogModal.vue`

复学特有：Section I–II、双声明 checkbox、蓝底 Note（无 Section III 家长）。

## 目标 / 非目标

**目标：**

- 6 态状态机 + 每状态 ≥2 条 Mock（≥12 条）
- 列表状态驱动 Actions + **各状态流转日志**
- Create / Edit Form Modal（Save Draft / Submit / Resubmit）
- Details 只读 + In Progress 内嵌审批；**不含内嵌 log**
- 对齐 Deferment / Programme Transfer 交互

**非目标：**

- Expired 双 mock
- Deferment Semester 联动休学 DEF 记录
- 后端 API、独立审批菜单页

## 设计决策

### 1. 数据模型 — `src/data/resumptions.js`

在 Phase 1 模型基础上扩展：

```javascript
{
  // Section I–II、attachment、declarationCorrect、declarationMaxDuration 等同 Phase 1 ...

  status: 'Draft' | 'In Progress' | 'Update Required' | 'Approved' | 'Rejected' | 'Cancelled',
  approvalStage: 'Pending Review' | 'Academic Affairs' | 'Approved' | '--',
  archived: boolean,
  applicationDeadline: string | null,

  approvalLog: ApprovalLogEntry[],
}
```

**`archived`**：`Approved` | `Rejected` | `Cancelled` 时为 `true`。

**ACTIVE_STATUSES**：`Draft`、`In Progress`、`Update Required`。

**列表列**：Original Intake → `originalIntake`；Resume Intake → `resumptionSemester`。

### 2. 状态机与权限 helper

| Status | 可 Edit | 可 Delete | 可 Cancel | 可 Resubmit | 可审批 | 列表 Actions |
|--------|---------|-----------|-----------|-------------|--------|--------------|
| Draft | ✓ | ✓ | ✗ | ✗ | ✗ | Details · Edit · Delete · 流转日志 |
| In Progress (Pending Review) | ✗ | ✗ | ✓ | ✗ | ✓ | Details · Cancel · 流转日志 |
| In Progress (审批已开始) | ✗ | ✗ | ✗ | ✗ | ✓ | Details · 流转日志 |
| Update Required | ✓ | ✗ | ✗ | ✓ | ✗ | Details · Edit · 流转日志 |
| Cancelled | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Rejected | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Approved | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |

**Cancel 规则**：仅 `In Progress` + `Pending Review` 且 log 尚无 Approved / Rejected / Update Required。

**导出 helper**：

- `canEditResumption`、`canDeleteResumption`、`canCancelResumption`、`canResubmitResumption`、`canApproveResumption`
- `isArchivedResumption`、`statusBadgeClass`
- `hasActiveResumptionForStudent`、`buildStudentSnapshotForResumption`
- `validateResumptionForm(data, mode)` — draft 仅校验 studentId；submit 含双声明 + 附件
- `saveDraftApplication`、`submitApplication`、`cancelApplication`、`resubmitApplication`

### 3. 审批流 — `src/data/

## 来源：add-withdrawal-app

## 背景说明

`add-withdrawal-app` Phase 1 已交付退学列表 + 简化 Pending 审批 + 中英文 i18n + 条件 ISAO Note。产品要求对齐 `add-deferment-app` / `add-resumption-app` **6 态流转语义** 与 **流程日志外置**。

项目内参考：

- **6 态状态机**：`deferments.js` + `DefermentView.vue`；`resumptions.js` + `ResumptionView.vue`（Phase 2/3 已落地）
- **审批**：`defermentApproval.js`（Pending Review → Academic Affairs → Approved）
- **流转日志**：`ApprovalLogModal.vue`

退学特有：Section I–III、单声明 checkbox、**International 紫底 ISAO Note**、Reason 列（`getMainReasonLabel`，无 UG/PG 后缀）。

## 目标 / 非目标

**目标：**

- 6 态状态机 + 每状态 ≥2 条 Mock（≥12 条）
- 列表状态驱动 Actions + **各状态流转日志**
- Create / Edit Form Modal（Save Draft / Submit / Resubmit）
- Details 只读 + In Progress 内嵌审批；**不含内嵌 log**
- 保留 ISAO Note 条件显示与 Reason 无后缀规则
- 对齐 Deferment / Resumption 交互

**非目标：**

- Expired 双 mock
- 原因选项 UG/PG 后缀
- China 类别 ISAO Note
- 后端 API、独立审批菜单页

## 设计决策

### 1. 数据模型 — `src/data/withdrawals.js`

在 Phase 1 模型基础上扩展：

```javascript
{
  // Section I–III、declarationAccepted、attachment、studentCategory 等同 Phase 1 ...

  status: 'Draft' | 'In Progress' | 'Update Required' | 'Approved' | 'Rejected' | 'Cancelled',
  approvalStage: 'Pending Review' | 'Academic Affairs' | 'Approved' | '--',
  archived: boolean,

  approvalLog: ApprovalLogEntry[],
}
```

**`archived`**：`Approved` | `Rejected` | `Cancelled` 时为 `true`。

**ACTIVE_STATUSES**：`Draft`、`In Progress`、`Update Required`。

**列表列**：Programme → `programme`；Intake → `intake`；Reason → `mainReason`（经 `getMainReasonLabel`）。

### 2. 状态机与权限 helper

| Status | 可 Edit | 可 Delete | 可 Cancel | 可 Resubmit | 可审批 | 列表 Actions |
|--------|---------|-----------|-----------|-------------|--------|--------------|
| Draft | ✓ | ✓ | ✗ | ✗ | ✗ | Details · Edit · Delete · 流转日志 |
| In Progress (Pending Review) | ✗ | ✗ | ✓ | ✗ | ✓ | Details · Cancel · 流转日志 |
| In Progress (审批已开始) | ✗ | ✗ | ✗ | ✗ | ✓ | Details · 流转日志 |
| Update Required | ✓ | ✗ | ✗ | ✓ | ✗ | Details · Edit · 流转日志 |
| Cancelled | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Rejected | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Approved | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |

**Cancel 规则**：仅 `In Progress` + `Pending Review` 且 log 尚无 Approved / Rejected / Update Required。

**导出 helper**：

- `canEditWithdrawal`、`canDeleteWithdrawal`、`canCancelWithdrawal`、`canResubmitWithdrawal`、`canApproveWithdrawal`
- `isArchivedWithdrawal`、`statusBadgeClass`
- `hasActiveWithdrawalForStudent`、`buildStudentSnapshotForWithdrawal`、`shouldShowIsaoNote`
- `validateWithdrawalForm(data, mode)` — draft 仅校验 studentId；submit 含 Sectio

## 来源：add-withdrawal-final-assessment-field

## Context

`WithdrawalFormModal` SECTION II 现为 Whereabout / Destination / Last Date / Main Reason / Detailed Reason。产品增加 Final Assessment 确认，并重排第二行。

决策确认（2026-07-15）：
- 选 Yes → **自动填写** Exam week 最后一天，**可二次调整**
- 两个字段 tooltip **始终展示**（不随 Yes/No 显隐）
- 原型用 mock 考试周末日，不接真实校历

## Goals / Non-Goals

**Goals:**
- 必填 Yes/No + 重排布局 + 常显 tip
- Yes 时预填 mock 考试周末日且可改

**Non-Goals:**
- 真实 Exam week 计算；锁定日期；No 时改 tip 文案

## Decisions

1. **字段名**：`completeFinalAssessment`，取值 `'' | 'Yes' | 'No'`（与现有 Yes/No 文案一致）。

2. **Mock 考试周末日**：新增 `getExamWeekLastDayForSession(session)`（或按申请日固定落一 mock ISO），根据 `applicationSession` / `currentAcademicSession` 取映射；无映射则用稳定默认日期（如当前演示学期末一日）。写入时机：用户将下拉改为 `Yes` 时赋值；已改为 Yes 后再次切换不强制覆盖手动值——仅在「刚变成 Yes」或日期为空时写入。

3. **Tooltip**：复用 `DefermentFormModal` 的 `field-hint-tip-wrap` / `?` 样式；文案 i18n：
   - `completeFinalAssessmentHint`：产品提供的英文句 + 中文翻译  
   - `lastDateOfAttendanceHint`：说明 Yes → Exam week 最后一天

4. **详情**：只读展示 Yes/No 标签与日期。

## Risks / Trade-offs

- [Risk] mock 日期与真实校历不符 → Mitigation：tip 已说明规则；后续可换真实数据源
- [Risk] Yes→No→Yes 是否再次覆盖手改 → Mitigation：仅在切入 Yes 且（策略选空时填 / 或每次切入 Yes 都重填）；推荐「切入 Yes 时总是写入 mock 日期，用户可再改」，实现简单、与「自动填写」语感一致

## Open Questions

（已关闭）

## 来源：refine-movement-application-default-tab-and-visa-expiry

# 设计
## 默认 Tab

```javascript
const activeTab = ref('programme-transfer')
```

管理端 `applicantMode=teacher` 与学生端 `student` 共用壳层，一处修改即可。

## 学生Visa Expiry Date

```javascript
resolveMovementVisaExpiryFromStudent(student)
  category = studentCategory || studentType || resolveCategoryFromNationality(nationality)
  if !isChinaOrInternationalCategory(category) → '—'
  else → formatStudentPassExpiryPeriod(basicInfo) || '—'

displayMovementVisaExpiry(storedValue, category) // 详情只读
```

| 学生Category | 展示 |
|------------------|------|
| China | 日期范围或 `—` |
| International | 日期范围或 `—` |
| Local | `—` |

字段名：`visaExpiryDate`（与转专业现有模型一致）。  
标签：`movementCommon.fields.visaExpiry` = `学生Visa Expiry Date`。

## 不改动

- 学籍 Basic Info Tab 现有 China/International 规则
- 培养方案 catalogue L 码存储

## 来源：refine-movement-declaration-content

# 设计
| 类型 | 条款 |
|------|------|
| 全部 | 1. 信息真实完整 |
| 休学/复学 | +2. 最长修业年限 |
| 退学 | 仅 1 |
| 转专业 | 1 + 2. 规章承诺 + 3. 签证取消/新签 |

单勾选 `declarationAgreed` / `declarationAccepted` 不变。

## 来源：refine-movement-parent-contacts-readonly

## Context

上一版允许多监护人可编辑快照并支持增删。产品现要求：申请内仅展示学生信息页带出的数据。

已确认：
- 教师代填、学生自填无监护人时均禁止提交
- tip 放在 SECTION III 标题旁（与 section-bar 同行）

## Goals / Non-Goals

**Goals:**
- 只读、无增删、标题 tip、空档案拦截提交

**Non-Goals:**
- 跳转学生档案深链；转专业/复学引入 Section III

## Decisions

1. **UI**：`MovementParentConsentSection` 增加 `readOnly`（或默认只读），输入 `readonly`，去掉垃圾桶与添加按钮；空列表提示改为「请先在学生个人信息页维护至少一位家长/监护人」。

2. **标题 tip**：因 `section-bar` 在各 FormModal 内渲染，于休学/退学两处标题旁加 `field-hint-tip-wrap`（与 deferment period tip 同款）；文案 i18n 共用键如 `movementCommon.parentConsent.fromProfileHint`。

3. **校验**：沿用 `validateParentContacts`「至少 1 个」；教师与学生同一提交路径，无需分流。

4. **快照**：选学生仍写 `parentContacts`；打开学生端从当前学生 family 带出；申请内不再 `@update:contacts` 因增删。只读可不 emit。

## Risks / Trade-offs

- [Risk] 编辑草稿时档案已变更 → Mitigation：原型以打开/选学生时快照为准；与声明一致「改档案后再申请」

## Open Questions

（已关闭）

## 来源：refine-movement-student-info-fields

## Current Whereabout

- 值域：`In Campus` | `Out of Campus`
- 必填；placeholder：`Select Current Whereabout`

## Current Academic Session

- 数据 key：`currentAcademicSession`
- 来源：`student.enrollment.academicSession`（normalize `YYYY/MM`）
- 与 `applicationSession`（intake）并列展示，只读
- **布局**：Section I 第 2 行 — 左 `currentAcademicSession`，右 `applicationSession`
- 转专业 Section I 第 3 行左 — `dateOfApplication`（只读，create 默认当天）
- Section I 末段 — `personalEmail`、`phoneNumber`（四异动）；`accommodationRoomNo`（休学/退学）；选学生 snapshot 带出，submit 不校验必填
- 转专业 Section II — `transferReason` 长文本 textarea（必填）；保留 `reasonId` 数据层兼容；Section V Declaration 不变

## 来源：reorder-movement-declaration-and-applicant-notes

## 背景

四类异动申请表单原先将「学生声明」放在「支持性文件」之前，与真实填报顺序（先填表、上传附件、再勾选声明）不符。退学缺少图示 Instructional Note；休学/复学缺少顶部申请人说明。

## 目标 Section 顺序

| 类型 | 顺序 |
|------|------|
| 转专业 | I 学生 → II 转专业 → **III 附件** → **IV 声明** → VII 教务办 |
| 休学/退学 | I 学生 → II 申请 → III 家长同意 → **IV 附件** → **V 声明** |
| 复学 | I 学生 → II 复学详情 → **III 附件** → **IV 声明** |

表单末尾提示：
- 复学：`noteAlert` 保留在声明之后
- 休学：`infoAlert` 保留在声明之后
- 退学：ISAO 提示保留在声明之后（国际生）

## 组件设计

```
MovementApplicantNotes.vue
  props: titleKey, itemKeys[], variant ('default' | 'instructional')
  - default: 蓝色说明框（转专业/休学/复学）
  - instructional: 黄色说明框（退学 6 条 Instructional Note）

movementApplicantNotes.js
  - 四类 note item key 列表，与 i18n 分离
```

详情视图（`MovementDetailContent`、各 `*DetailModal`）与表单保持相同 Section 顺序；顶部只读展示 `MovementApplicantNotes`。

## i18n

- `*.sections.*` 按上表重编号（III/IV/V）
- 新增 `deferment.notes`、`resumption.notes`、`withdrawal.notes`（中英各一套）
- 转专业沿用既有 `programmeTransfer.notes` 结构作为 demo 模板

## 非目标

- 不改声明条款正文、校验规则
- 不改 Section VII 教务办区块（转专业）

## 来源：restructure-movement-application-sections

# 设计：Section II–IV 重组

## Section II grid

| 类型 | Row 1 | Row 2 | Row 3 |
|------|-------|-------|-------|
| 休学 | Deferment Period \| Main Reason | Detailed Reason (span-2) | — |
| 退学 | Whereabout \| Destination | Last Date \| Main Reason | Detailed Reason (span-2) |
| 复学 | Deferment Period \| Resumption Period | — | — |
| 转专业 | Start Semester (span-2 或单列) | 1st Choice \| 2nd Choice | transferReason textarea (span-2) |

休学 `defermentStartDate`/`defermentEndDate` 仍由 period 联动计算并持久化，**不出现在 Section II 表单**；详情可继续展示。

转专业 Section I 末尾增加 Current Programme / Intake / School 只读快照。

## Section III grid（休学/退学）

```
Name          | Relationship
NRIC/Passport | Contact No.
Email         (span-2)
```

`snapshot` 使用 `getPrimaryFamilyContact(student)`。

## Section IV

- `getMovementDocumentFields('resumption')` 不含 consent letter 槽位与下载按钮
- 休学/退学/转专业保留 consent 下载

## 来源：sort-deferment-period-options-desc

## 排序规则

对 `initialSemesterRecords` 映射为 `YYYY/MM` 前：

1. `academicYear` 降序
2. 同年内 `semester`（02 / 04 / 09）降序（09 → 04 → 02）

示例顺序：`2026/09` → `2026/04` → `2026/02` → `2025/09` → …

表单 `<option value="">pleaseSelect</option>` 仍在数据选项之前，不受排序影响。

## 来源：split-movement-application-teacher-student

## 背景说明

`split-movement-application-teacher-student` 首版已交付：双菜单、`applicantMode`、StudentSelectModal、学生本人列表与表单自动填充。四异动列表仍仅 **单行学号/姓名 keyword**；转专业另有 **进行中/已归档** Tab 分段。

### 学生选择弹框 — 专业层次列（演示策略 B）与横向滚动

四类异动 FormModal 共用 `StudentSelectModal.vue`。在既有「学号 / 姓名 / 专业 / 学院」列基础上增加「专业层次」列：

| 决策 | 说明 |
|------|------|
| 列值策略 | **一律展示固定文案**（中文「本科」、英文 `Undergraduate`），与 `consentForm.programmeLevel.Undergraduate` 对齐；不读取 `enrollment.programmeLevel` |
| 回填表单 | 选中学生后 Section I 的 `programmeLevel` 仍按既有 snapshot 从学籍填充，本列仅影响弹框展示 |
| 横向滚动 | 移除专业/学院列的 `max-width` + `ellipsis` 截断；单元格 `white-space: nowrap`；`.data-table` 设 `min-width`，`.table-wrap` 保持 `overflow: auto`，内容超出时出现左右滑动条 |
| 改动面 | 仅 `StudentSelectModal` + `studentSelect.*` i18n；四 FormModal 无需分别改 |

说明：若后续改为按真实层次展示，再切换为 `formatProgrammeLevelLabel` 即可。

### 学生选择弹框 — 国籍列

列序：**学号 → 姓名 → 国籍 → 专业 → 专业层次 → 学院**（置于姓名与专业之间）。

| 决策 | 说明 |
|------|------|
| 数据源 | `basicInfo.nationality`（回退 `item.nationality`），空值显示 `—` |
| 展示 | 英文界面显示英文国名；中文界面用既有 `tr()` / `zh-flat` 映射（如 Malaysia→马来西亚、China→中国），与教师表单国籍下拉一致 |
| 改动面 | 仅 `StudentSelectModal` normalize + 列 + `studentSelect.columns.nationality` i18n |

### 退学附件 — 统一图示3（马/中/其他）

产品确认：退学侧马来西亚、中国、其他国家均按 **图示3** 同一套国际生附件包完善；**不**再按国籍拆三套清单。休学/复学附件各自独立，本变更不改。

| 槽位 | 必填 | 说明 |
|------|------|------|
| consentLetter | * | 既有同意书 + Download |
| accommodationCheckOut | 否 | Accommodation Check Out Form |
| flightTickets | * | Flight Tickets (International Students) |
| medicalRecord | 否 | 新槽，与复学 `medicalRecovery` 分离 |
| otherDocuments[] | 否 | 默认 1 行；可添加更多；第 2 行起带关闭按钮 |

| 决策 | 说明 |
|------|------|
| 分支 | `getWithdrawalDocumentFields()` 固定返回上表；`getMovementDocumentFields('withdrawal')` 走该列表 |
| 切换学生 | `WithdrawalFormModal` 换学号时 `createEmptyMovementAttachments()` 并 `alert` 提示 |
| i18n | 住宿/机票/病历/其他附件/添加更多：中文界面中文标签，英文界面英文标签 |
| 双端 | 管理端与学生端共用 `WithdrawalFormModal` + 同一 fields，学生端按本人档案自动填充 |
| UI | 保持自定义「选择文件」按钮，不改原生 file 外观 |

### 休学附件 — 图示1–3（按国家）

国家顺序与退学一致：图1 马来西亚、图2 中国、图3 其他。

| 槽位 | 马来（图1） | 中国（图2） | 其他（图3） |
|------|-------------|-------------|-------------|
| consentLetter * | ✓ | ✓ | ✓ |
| medicalRecord（可选文案） | ✓ | ✓ | ✓ |
| flightTickets | — | ✓（可选） | ✓（可选） |
| otherDocuments[] | ✓ | ✓ | ✓ |

| 决策 | 说明 |
|------|------|
| 实现 | `getDefermentDocumentFields(nationality, category)` + `resolveAttachmentNationGroup` |
| 双端 | `DefermentFormModal` 传 `nationality`；学生端 `applicantMode=student` 自动带本人国籍 |
| 切换学生 | 清空附件 + `deferment.messages.attachmentsClearedOnStudentChange` |

### 复学附件 — 图示1–3（按国家）

国家顺序与退学/休学一致：图1 马来西亚、图2 中国、图3 其他。图上无同意书。

| 槽位 | 马来（图1） | 中国（图2） | 其他（图3） |
|------|-------------|-------------|-------------|
| visaRelatedDocuments * | — | ✓ | ✓ |
| medicalRecovery（可选） | ✓ | ✓ | ✓ |
| otherDocuments[] | ✓ | ✓ | ✓ |

| 决策 | 说明 |
|------|------|
| 实现 | `getResumptionDocumentFields`；新槽 `visaRelatedDocuments` |
| 双端 | `ResumptionFormModal` 传 `nationality`；学生端自动带本人国籍 |
| 切换学生 | 清空附件 + `resumption.messages.attachmentsClearedOnStudentChange` |

产品要求列表检索对齐异动查询/维护字段，并区分 portal 在搜索与列上的差异。

## 目标 / 非目标

**目标：**

- 四异动 × 老师/学生：专业代码、申请学年学期、审批状态、是否实施 过滤
- 搜索 UI：两行 + 可收起（参考 `MovementQueryView`）
- 老师首行含学号或姓名；**学生首行隐藏**学号或姓名
- 转专业：移除进行中/已归档 Tab，**单列表展示全部**（含终态）
- 学生表格隐藏学号/姓名列；老师保留
- 共享 filter 模块，避免四 View 重复逻辑
- 表单首行：学号 \| 姓名 \| 选择（teacher，选择在行末）
- Section I 末字段：申请学年学期（`applicationSession`，create 自动带出，`YYYY/MM`）
- 申请 Form/Detail 与审批、维护、查询列表 `applicationSession` 格式一致

**非目标：**

- 改 store 结构
- 新专业代码过滤
- 改 query/maintenance/approval 模块

## 设计决策

### 1. 共享搜索模块 — `movementApplicationSearch.js`

```javascript
export function createEmptyApplicationSearch() {
  return {
    keyword: '',           // teacher only (UI hides for student)
    programmeCode: '',
    applicationSession: '',
    status: '',
    implemented: '',
  }
}

export function filterMovementApplications(sourceKey, items, search, t) {
  // keyword → studentId / fullName / name
  // programmeCode → extractCurrentProgrammeCode(sourceKey, item)
  // applicationSession → extractApplicationSession(item)
  // status → exact match (includes Draft)
  // implemented → resolve via normalizeQueueItem(...).implemented
}
```

各 View 过滤链：

```
items from store
  → filterMovementApplications(sourceKey, items, appliedSearch, t)
  → [student] filterByCurrentStudent(...)
  → pagination
```

**状态选项**：各类型 `*StatusOptions`（含 Draft），非 query 的 `movementQueryStatusOptions`。

**是否实施选项**：`'' | 'Pending' | 'Implemented' | '—'`（label 复用 `movementMaintenance.implemented.*`）

### 2. 搜索 UI 布局

对齐 `MovementQueryView`：

```
┌─ Row 1 ──────────────────────────────────────────────────────┐
│ [teacher: 学号或姓名] │ 专业代码 │ 申请学年学期 │ 审批状态 │ Q/R/收起 │
└──────────────────────────────────────────────────────────────┘
┌─ Row 2 (collapsible, default expanded) ──────────────────────┐
│ 是否实施                                                      │
└──────────────────────────────────────────────────────────────┘
```

- 引入 `list-page-search.css`（四 View 若尚未引入则添加）
- `searchExpanded` ref + Transition 与查询页一致
- 可选抽 `MovementApplicationSearchBar.vue`，props：`applicantMode`、`searchForm`、`appliedSearch` emit

### 3. 转专业 — 移除 active/archived Tab

删除：

- `listTab` ref
- `.filter-tabs` UI
- `filteredTransfers` 内 `isArchivedTransfer` 分段

**结果**：Draft / In Progress / 终态等同屏；终态通过审批状态下拉筛选。

### 4. 表格列 — `applicantMode`

四 View 表头/单元格：

```vue
<th v-if="ap

## 来源：unify-movement-date-format

## 背景说明

异动模块各 data 文件各自实现 `format*ListDate` / `formatApplicationDateDisplay`，使用 `DD MMM YYYY`（如 `15 Oct 2023`）。审批 log 写入 `formatDefermentDateTime` 等 `DD.MM.YYYY HH:mm`。维护 `movementDate` mock 已为 `YYYY-MM-DD`，但申请/审批列表不一致。

## 目标 / 非目标

**目标：**

- 单一 helper `formatMovementDate(value)` → `YYYY-MM-DD` 或 `—` / 空
- 异动全链路**展示**统一；Export 同步
- approvalLog 新写入与展示均为 `YYYY-MM-DD`
- 兼容解析 ISO、现有 `YYYY-MM-DD` mock、可解析的旧 `DD MMM YYYY` seed（formatter 内 fallback）

**非目标：**

- 改 `applicationSession`（`YYYY/MM`）
- 学生档案、非异动模块
- DatePicker 输入 UX
- 强制迁移全部 mock seed（formatter 兼容即可）

## 设计决策

### 1. Helper — `src/utils/formatMovementDate.js`

```javascript
export function formatMovementDate(value) {
  if (value === '' || value == null) return '—'
  // ISO YYYY-MM-DD passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) return value.trim()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}

export function formatMovementDateOrEmpty(value) {
  const formatted = formatMovementDate(value)
  return formatted === '—' ? '' : formatted
}
```

**Log 写入：**

```javascript
// movementApprovalEngine formatDateTime → formatMovementDate(new Date())
// 或 toISOString().slice(0, 10)
```

**字符串比较：** `YYYY-MM-DD` 字典序可用于 `entry.dateTime >= cycleStart`（现有 engine 逻辑）。

### 2. 替换 map

| 现函数 | 文件 | 动作 |
|--------|------|------|
| `formatApplicationDateDisplay` | deferments, withdrawals, resumptions | 委托 `formatMovementDate` |
| `formatDefermentListDate` | deferments.js | 委托 |
| `formatTransferListDate` | programmeTransfers.js | 委托 |
| `formatWithdrawalListDate` | withdrawals.js | 委托 |
| `formatResumptionListDate` | resumptions.js | 委托 |
| `formatApprovalApplicationDate` | movementApprovalQueue.js | 各 case 委托 |
| `formatMovementDateDisplay` | movementMaintenanceFields.js | 委托 |
| `ApprovalLogModal` `item.dateTime` | 组件 | `formatMovementDate(item.dateTime)` |
| Export formatters | export*Excel.js | 日期列走 helper |

### 3. 触点清单

```
申请列表 date column     ─┐
Form/Detail 只读日期      ─┤
审批 Application Date    ─┼── formatMovementDate()
维护/查询 movementDate   ─┤
Export 日期列            ─┤
ApprovalLogModal         ─┘
```

### 4. 与 §16 applicationSession 边界

| 字段 | 格式 | Helper |
|------|------|--------|
| `applicationSession` | `YYYY/MM` | `resolveApplicationSessionFromStudent` / 原值 |
| `dateOfApplication`, `movementDate`, log `dateTime` | `YYYY-MM-DD` | `formatMovementDate` |

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 旧 mock log 非 IS

## 来源：unify-movement-declaration-section

# 设计
## 参考 UI（转专业）

```
SECTION III : DECLARATION BY THE STUDENT
┌──────────────────────────────┐
│ • item1                      │
│ • item2                      │
│ ☑ I agree to the declaration │
└──────────────────────────────┘
→ Documents（保留 Download Consent Letter，不含家长同意书下载）
```

## 各类型

| 类型 | 条款 | 勾选 | 移除家长下载 |
|------|------|------|-------------|
| 转专业 | item1+item2 | declarationAgreed | N/A |
| 休学 | 同转专业 | declarationAgreed（新增） | ✅ |
| 退学 | correct | declarationAccepted | ✅ |
| 复学 | correct+maxDuration | 两个 checkbox | N/A |

## 组件

`MovementDeclarationSection` 接收 sectionTitle、items[]、checkboxes[{field,labelKey?}]、form、errors。

## 来源：update-movement-application-details

## 背景说明

四异动详情 Modal 当前结构（以转专业为例）：

```
┌─ Detail Modal ─────────────────────────────────────┐
│  Meta: AppId | Status | Approval Stage             │
│  Section I–IV (申请内容)                            │
│  Section VII (教务) ← 仅转专业，且 In Progress 可编辑 │
│  approval-box (Action/Comment/Submit) ← 四模块均有   │
└────────────────────────────────────────────────────┘
```

导航 IA（`restructure-student-records-navigation`）：

```
学籍异动申请 Tab → 四 View → Details（学生侧只读）
学籍异动审批     → 未来独立模块 → 审批 + 流转
列表 Actions     → 流转日志（已有 ApprovalLogModal）
```

图示附件区（详情只读）：

```
┌──────────────────────────────────────────────────────────┐
│ Upload Attachment * :          [Download Consent Letter ↓]│
│ 📄 Existing Attachment.pdf                               │
└──────────────────────────────────────────────────────────┘
```

## 目标 / 非目标

**目标：**

- 详情 = 表单申请字段的只读镜像（不含 Section VII、不含审批 UI）
- 共享附件只读组件，四模块一致
- 审批能力从 UI 剥离但 data 层保留

**非目标：**

- 新建审批模块页面
- 改状态机或 mock 条数

## 设计决策

### 1. 详情 vs 表单字段对齐表

**ProgrammeTransferDetailModal** 保留：

- Section I 学生Details（7 字段）
- Section II Transfer Information
- Section III Declaration（Yes/No 或完整声明摘要）
- Section IV Documents → `MovementAttachmentReadonly`

**移除：**

- Section VII 整块
- `showSectionSevenEdit` / `adminForm` / `canEditSectionSeven`
- header `officeSubtitle`
- `approval-box` 与 `ConfirmDialog`

**Deferment / Withdrawal** — 保留至 Parent Consent 为止；**Resumption** — 保留 Declaration section。

### 2. 共享组件 `MovementAttachmentReadonly.vue`

```vue
props:
  fileName: String | null      // item.attachment?.fileName
  labelKey: String             // e.g. programmeTransfer.fields.uploadAttachment
  downloadLabelKey: String     // e.g. programmeTransfer.fields.downloadConsent
  consentHintKey: String       // alert hint on download
  required: Boolean (default true)
```

**布局 CSS（scoped）：**

```css
.attachment-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
}
.attachment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.attachment-file-link {
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
```

**行为：**

- 有 `fileName`：显示可点击链接（mock：`window.alert` 或 noop）
- 无附件：`—` 或 i18n 占位
- Download Consent Letter：emit 或内部调用 `downloadConsentLetter` 模式（alert hint）

### 3. DetailModal 精简模式

```javascript
// 删除
emit: ['close', 'edit']  // 移除 'approve'

// 删除 imports
programmeTransferApproval.js / canApproveTransfer / ...

// meta-row 仅保留
applicationId + statusBadge
```

**Deferme
