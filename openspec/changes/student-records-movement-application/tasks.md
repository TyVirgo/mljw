# 学籍管理-异动申请（教职工/学生端） — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-deferment-app

```
## 1. i18n 文案

- [x] 1.1 在 `src/i18n/locales/zh.js`、`en.js` 新增 `deferment.*`：列表标题、搜索标签、Section I–III / Supporting Documents 标题与字段标签、Main Reason 选项、底部说明文案、操作按钮
- [x] 1.2 在 `zh-flat.js` 同步状态徽章及校验错误提示（Phase 1 为 Pending/Approved/Rejected）

## 2. 数据层

- [x] 2.1 创建 `src/data/deferments.js`：嵌套数据模型、`initialDeferments` mock、`normalizeDeferment`、`createDefermentId`、`createApplicationId`（DEF001 格式）
- [x] 2.2 实现状态/权限 helper（Phase 1 简化版）
- [x] 2.3 实现 `buildStudentSnapshotForDeferment(student)`
- [x] 2.4 实现 `validateDefermentForm(data)`、`submitDefermentApplication`、日期/列表格式化函数
- [x] 2.5 创建 `src/data/defermentApproval.js`：单段 Approved/Rejected（Phase 1）

## 3. 表单 Modal

- [x] 3.1 创建 `DefermentFormModal.vue`：宽屏可滚动 Modal 壳层
- [x] 3.2–3.6 Section I–III、Supporting Documents、Footer Close/Submit（Phase 1 Submit-only）

## 4. 详情 Modal

- [x] 4.1 创建 `DefermentDetailModal.vue`：全 Section 只读展示
- [x] 4.2 内嵌审批区（Phase 1 Pending：Approved / Rejected）
- [x] 4.3 集成 `defermentApproval.js`

## 5. 列表页

- [x] 5.1 创建 `DefermentView.vue`：搜索首行 + Deferment History + `+ New Deferment`
- [x] 5.2 表格 10 列 + 状态徽章 + Actions（Phase 1）
- [x] 5.3 集成 TablePagination、Form/Detail Modal
- [x] 5.4 样式 adapt 自 `ProgrammeTransferView.vue`

## 6. 路由与菜单注册

- [x] 6.1 `studentRecordsMenu.js` 加入 `sr-deferment`
- [x] 6.2 `App.vue` import `DefermentView`

## 7. Mock 演示与验证（Phase 1）

- [x] 7.1 冒烟：Submit → Pending → Approve/Reject（Phase 1 简化流）
- [x] 7.2 `npm run build` 通过

## 8. 休学页中英文 i18n（Phase 2）

- [x] 8.1 完善 `zh.js` 中 `deferment.*` 中文文案
- [x] 
```

### add-deferment-period-dates

```
# 任务
## 1. 数据与查询

- [x] 1.1 向 semesterInfo 补充 2024 学年学期记录，覆盖 mock 查询
- [x] 1.2 在 deferments.js 实现 resolveDefermentPeriodDates、getDefermentPeriodOptions
- [x] 1.3 createEmptyDeferment、normalizeDeferment 增加 defermentStartDate / defermentEndDate

## 2. 界面

- [x] 2.1 DefermentFormModal：监听休学期间，只读展示起止日期行
- [x] 2.2 DefermentDetailModal + MovementDetailContent 同步展示
- [x] 2.3 i18n zh/en + zh-flat

## 3. 状态日志集成

- [x] 3.1 buildDefermentStatusLogRemarkLines + 扩展 applyStudentProfileFromMovement
- [x] 3.2 维护与审批引擎传入异动上下文
- [x] 3.3 更新 mock deferments 与学生 statusLogs
```

### add-deferment-period-field-tooltip

```
## 1. i18n

- [x] 1.1 新增 `deferment.fields.defermentPeriodHint`（zh/en）

## 2. 界面
- [x] 2.1 `movement-form.css` 增加 field-hint 样式
- [x] 2.2 `DefermentFormModal.vue` 休学期间标签接入 tooltip

## 3. 验证

- [x] 3.1 `npm run build`
```

### add-deferment-resumption-period-date-fields

```
# 任务
- [x] 1. 复学数据层 sync defermentStartDate/EndDate
- [x] 2. 休学/复学 FormModal 只读回显行
- [x] 3. i18n 标签「休学开始/结束日期」
- [x] 4. `npm run build` 验证
```

### add-movement-declaration-parent-email-notice

```
## 1. 数据与文案

- [x] 1.1 在 `movementCommon.declaration`（en/zh）新增 `parentEmailNotice` 中英文案
- [x] 1.2 在 `movementDeclarationItems.js` 将新条款加入四类声明 items（紧接 correct 之后）

## 2. 冒烟

- [x] 2.1 确认转专业 / 休学 / 退学 / 复学 表单或详情 Section V 均出现该新条款且编号正确
```

### add-movement-international-remarks-and-documents

```
## 1. 数据与 i18n

- [x] 1.1 新建 `movementAttachments.js`（slots / validate / withMovementAttachments）
- [x] 1.2 新建 `movementInternationalRemarks.js` + 四类 `internationalRemarks.*` i18n
- [x] 1.3 四类 *s.js 接入 attachments 与 `validateMovementAttachments`

## 2. 组件

- [x] 2.1 `MovementInternationalStudentRemarks.vue`
- [x] 2.2 `MovementDocumentsUploadSection.vue`
- [x] 2.3 `MovementAttachmentsReadonly.vue`

## 3. 表单与详情

- [x] 3.1 四类 FormModal 接入国际说明 + 多附件
- [x] 3.2 `MovementDetailContent` + 四类 DetailModal 接入
- [x] 3.3 退学移除 `isaoNoteAlert`（由国际说明取代）

## 4. 验证

- [x] 4.1 `npm run build`
```

### add-movement-parent-contacts-from-family

```
# 任务

- [x] 新增 `movementParentContacts.js` 工具（映射/归一化/校验/legacy 同步）
- [x] 新增 `MovementParentConsentSection.vue` 与 `MovementParentConsentReadonly.vue`（复用原 form-grid / detail-grid）
- [x] 更新 `deferments.js` / `withdrawals.js` 数据层与校验
- [x] 更新休学/退学表单 Modal Section III
- [x] 更新详情 Modal 与 `MovementDetailContent`
- [x] Section III 支持增删：标题栏垃圾桶（含仅 1 条可删至 0）、底部添加按钮、空态不自动插空白行
- [x] 补充 i18n（添加/空态文案）
- [x] 自测核对：删至 0 → 添加 → 提交校验至少一条（逻辑已接 validateParentContacts）
```

### add-programme-transfer-app

```
## 1. i18n 文案

- [x] 1.1 在 `src/i18n/locales/zh.js`、`en.js` 新增 `programmeTransfer.*`：页面标题、Section I–IV/VII 标题、字段标签、Notes 三条、声明文案、操作按钮（Save Draft / Submit / Cancel / Resubmit）
- [x] 1.2 在 `zh-flat.js` 同步 7 种状态徽章文案（Draft、In Progress、Update Required→需修改、Approved、Rejected、Cancelled、Expired）及校验错误提示

## 2. 数据层

- [x] 2.1 创建 `src/data/programmeTransfers.js`：嵌套数据模型、`initialProgrammeTransfers` mock（≥4 条覆盖 Draft/In Progress/Approved/Update Required）、`normalizeTransfer`、`createTransferId`、`createApplicationId`
- [x] 2.2 实现状态/权限 helper：`canEditTransfer`、`canDeleteTransfer`、`canCancelTransfer`、`canResubmitTransfer`、`canApproveTransfer`、`isArchivedTransfer`、`statusBadgeClass`
- [x] 2.3 实现 `buildStudentSnapshotFromProfile(student)`：从 `students.js` 填充 Section I/II（含 Local/China/International 护照/IC 差异）
- [x] 2.4 实现 `validateTransferForm(data, mode)`、`hasActiveTransferForStudent`、状态变更函数（saveDraft、submitApplication、cancelApplication、resubmitApplication、expireApplication）
- [x] 2.5 创建 `src/data/programmeTransferApproval.js`：`STAGE_FLOW`、审批动作（Approved/Update Required/Rejected）、`applyApprovalDecisionToItem`、`validateApprovalForm`（对齐 `courseApproval.js` 模式）

## 3. 表单 Modal

- [x] 3.1 创建 `ProgrammeTransferFormModal.vue`：宽屏可滚动 Modal 壳层、Notes 蓝底说明区、Section 灰条标题样式
- [x] 3.2 实现 Section I：Student ID 可搜索下拉 + 联动自动填充
- [x] 3.3 实现 Section II：Current 三字段 + New Programme 1st/2nd 下拉 + Start Semester 下拉 + Reasons textarea
- [x] 3.4 实现 Section III：声明文案 + 必选 checkbox
- [x] 3.5 实现 Section IV：附件 mock 上传（文件名/大小）+ Con
```

### add-programme-transfer-office-use-approval

```
## 1. 数据与组件

- [x] 1.1 resolveProgrammeTransferOfficeUseDefaults + OfficeUseSection 组件
- [x] 1.2 i18n adminApprovalDate

## 2. 界面
- [x] 2.1 FormModal 移除 Section VII
- [x] 2.2 Drawer / DetailModal / MovementDetailContent 挂载
- [x] 2.3 Section VII 对齐 movement-detail-body 样式（section-bar + detail-grid / form-grid）
- [x] 2.4 审批提交 adminFields

## 3. 验证

- [x] 3.1 npm run build
```

### add-programme-transfer-status-log-remark

```
# 任务
- [x] 1. 新增 programmeTransferStatusLog.js 辅助函数
- [x] 2. applyStudentProfileFromMovement 转专业分支接入
- [x] 3. 更新学生 mock statusLogs 与已批准转专业 applicationSession
- [x] 4. 从 programmeTransfers.js 重新导出
```

### add-resumption-app

```
## 1. i18n 文案（中英文首版同步）

- [x] 1.1 在 `src/i18n/locales/en.js`、`zh.js` 新增 `resumption.*`：列表、Section I–II、Supporting Documents、双声明、蓝底 Note、状态、审批、操作按钮
- [x] 1.2 在 `zh-flat.js` 同步 Pending/Approved/Rejected 及复学校验、声明、审批 flat 中文映射

## 2. 数据层

- [x] 2.1 创建 `src/data/resumptions.js`：模型、`initialResumptions` mock（≥3 条 Pending/Approved/Rejected）、`normalizeResumption`、`createResumptionId`、`createApplicationId`（RES001）
- [x] 2.2 实现 helper：`canApproveResumption`、`isArchivedResumption`、`statusBadgeClass`、`hasPendingResumptionForStudent`
- [x] 2.3 实现 `buildStudentSnapshotForResumption(student)`：联动 Section I/II
- [x] 2.4 实现 `validateResumptionForm(data)`、`submitResumptionApplication`、日期格式化
- [x] 2.5 创建 `src/data/resumptionApproval.js`：单段 Approved/Rejected、`applyApprovalDecisionToItem`、`validateApprovalForm`

## 3. 表单 Modal

- [x] 3.1 创建 `ResumptionFormModal.vue`：壳层 + 灰条 Section（参考 `DefermentFormModal.vue`）
- [x] 3.2 实现 Section I：Student ID 搜索 + Date of Application 只读 + 联动
- [x] 3.3 实现 Section II：Email/Phone/Deferment Semester/Resumption Semester
- [x] 3.4 实现 Supporting Documents + 双声明 checkbox + 蓝底 Note + Close/Submit

## 4. 详情 Modal

- [x] 4.1 创建 `ResumptionDetailModal.vue`：只读 Section + 声明 + approvalLog
- [x] 4.2 内嵌审批区（Pending：Approved/Rejected + comment）
- [x] 4.3 集成 `resumptionApproval.js`

## 5. 列表页

- [x] 5.1 创建 `ResumptionView.vue`：首行搜索 + Resumption History + `+ New Resumption`
- [x] 5.2 表格 9 列 + 状态徽章 + 行内仅 Details
- [x] 5.3 集成 TablePagination、Form/Detail Modal、内存 CRUD 与审批更新
- [x] 5.4 样式 
```

### add-withdrawal-app

```
## 1. i18n 文案（中英文首版同步）

- [x] 1.1 在 `src/i18n/locales/en.js`、`zh.js` 新增 `withdrawal.*`：列表、Section I–III、Supporting Documents、单声明、ISAO Note、状态、审批、操作按钮、主要原因选项
- [x] 1.2 在 `zh-flat.js` 同步 Pending/Approved/Rejected 及退学校验、声明、审批 flat 中文映射
- [x] 1.3 实现 `getMainReasonLabel(reason, t)`（不拼接 UG/PG 后缀）

## 2. 数据层

- [x] 2.1 创建 `src/data/withdrawals.js`：模型、`initialWithdrawals` mock（≥3 条 Pending/Approved/Rejected，含 WDR001）、`normalizeWithdrawal`、`createWithdrawalId`、`createApplicationId`（WDR001）
- [x] 2.2 实现 helper：`canApproveWithdrawal`、`isArchivedWithdrawal`、`statusBadgeClass`、`hasPendingWithdrawalForStudent`、`shouldShowIsaoNote(category)`
- [x] 2.3 实现 `buildStudentSnapshotForWithdrawal(student)`：联动 Section I/II + `studentCategory`
- [x] 2.4 实现 `validateWithdrawalForm(data)`、`submitWithdrawalApplication`、日期格式化、`mainReasonOptions`
- [x] 2.5 创建 `src/data/withdrawalApproval.js`：单段 Approved/Rejected、`applyApprovalDecisionToItem`、`validateApprovalForm`

## 3. 表单 Modal

- [x] 3.1 创建 `WithdrawalFormModal.vue`：壳层 + 灰条 Section（参考 `DefermentFormModal.vue`）
- [x] 3.2 实现 Section I：Student ID 搜索 + Date of Application 只读 + 联动
- [x] 3.3 实现 Section II：Email/Phone/Last Date of Attendance/Destination/Main Reason/Current Whereabout/Detailed Reason
- [x] 3.4 实现单声明 checkbox + Section III 家长字段 + 条件紫底 ISAO Note（仅 International）
- [x] 3.5 实现 Supporting Documents + Close/Submit

## 4. 详情 Modal

- [x] 4.1 创建 `WithdrawalDetailModal.vue`：只读 Section + 声明 + 条件 ISAO Note + approvalLog
- [x] 4.2 内嵌审批区（Pending：Approved/R
```

### add-withdrawal-final-assessment-field

```
## 1. 数据与文案

- [x] 1.1 在 `withdrawals.js` 增加 `completeFinalAssessment`、提交校验，以及 mock `getExamWeekLastDay`（或等价）
- [x] 1.2 补充 en/zh：字段标签、Hint、详情用文案

## 2. 表单与详情

- [x] 2.1 `WithdrawalFormModal`：按新顺序排版；Final Assessment 下拉 + tip；Last Date tip；选 Yes 自动填日期且可改
- [x] 2.2 `WithdrawalDetailModal` / `MovementDetailContent` 展示该字段

## 3. 冒烟

- [x] 3.1 选 Yes 自动出日期可改；未选提交报错；两 tip 常显；布局符合提案
```

### refine-movement-application-default-tab-and-visa-expiry

```
# 任务
## 1. OpenSpec 与壳层
- [x] 1.1 默认 Tab → programme-transfer
- [x] 1.2 movementVisaExpiry 工具 + movementCommon i18n

## 2. 表单与数据
- [x] 2.1 四类型 buildStudentSnapshot + createEmpty 增加 visaExpiryDate / studentCategory
- [x] 2.2 四 FormModal Section I 只读字段

## 3. 详情与验证
- [x] 3.1 四 DetailModal + MovementDetailContent 同步
- [x] 3.2 npm run build
```

### refine-movement-declaration-content

```
## 1. 数据与 i18n

- [x] 1.1 movementDeclarationItems 按类型拆分 + movementCommon.declaration
- [x] 1.2 转专业 visa 条款 i18n

## 2. 界面
- [x] 2.1 MovementDeclarationSection 有序列表
- [x] 2.2 四 FormModal / DetailModal / MovementDetailContent 引用正确 items

## 3. 验证

- [x] 3.1 npm run build
```

### refine-movement-parent-contacts-readonly

```
## 1. UI 与文案

- [x] 1.1 `MovementParentConsentSection` 改为只读：去掉增删，字段不可编辑，空态文案引导去档案
- [x] 1.2 休学/退学 FormModal 的 SECTION III 标题旁加 tip（共用 i18n）

## 2. 校验确认

- [x] 2.1 确认无监护人时提交（教师/学生）均被 `validateParentContacts` 拦截；必要时优化错误文案

## 3. 冒烟

- [x] 3.1 有监护人：只读展示、无增删；无监护人：禁止提交；标题 tip 可见
```

### refine-movement-student-info-fields

```
## 1. 数据与工具

- [x] 1.1 `currentWhereaboutOptions` + `resolveCurrentAcademicSessionFromStudent`
- [x] 1.2 四异动 snapshot / createEmpty / payload

## 2. 界面
- [x] 2.1 退学 Form 下拉 + 四异动 Current Academic Session
- [x] 2.2 Detail / MovementDetailContent
- [x] 2.3 Section I 第 2 行：左目前所在学期、右申请学年学期
- [x] 2.4 转专业 Section I 第 3 行左：申请日期
- [x] 2.5 Section I：personalEmail / phoneNumber（四异动）；accommodationRoomNo（休学/退学）；非必填、选学生带出
- [x] 2.6 转专业 transferReason 改为 textarea，保留既有 transferReason 数据

## 3. 验证

- [x] 3.1 `npm run build`
```

### reorder-movement-declaration-and-applicant-notes

```
## 1. 基础组件与 i18n

- [x] 1.1 新建 `MovementApplicantNotes.vue` 与 `movementApplicantNotes.js`
- [x] 1.2 四类 `sections` 重编号；新增 deferment/resumption/withdrawal notes（中英）

## 2. 表单 Modal

- [x] 2.1 `ProgrammeTransferFormModal.vue`：声明后移；顶部 notes
- [x] 2.2 `DefermentFormModal.vue`：声明后移；顶部 notes；末尾 infoAlert
- [x] 2.3 `WithdrawalFormModal.vue`：顶部 instructional notes；声明在附件后；ISAO 在末尾
- [x] 2.4 `ResumptionFormModal.vue`：顶部 notes；声明在附件后；末尾 noteAlert

## 3. 详情视图

- [x] 3.1 `MovementDetailContent.vue`：顺序与表单一致；顶部只读 notes
- [x] 3.2 四类 `*DetailModal.vue`：同上

## 4. 验证

- [x] 4.1 `npm run build`
```

### restructure-movement-application-sections

```
## 1. OpenSpec 与 i18n
- [x] 1.1 Section II 标题统一；复学/转专业 section key 对齐

## 2. 数据

- [x] 2.1 退学 snapshot 使用 `getPrimaryFamilyContact`
- [x] 2.2 复学 attachments 去掉 consent letter

## 3. FormModal Section II–III
- [x] 3.1 休学 Section II 重排；移除表单内起止日期展示
- [x] 3.2 退学 Section II 重排；Section III 监护人 grid
- [x] 3.3 复学 Section II 标题与布局
- [x] 3.4 转专业 Current 移 Section I；Section II 重排

## 4. 详情 / 抽屉
- [x] 4.1 四 DetailModal + MovementDetailContent 同步

## 5. 验证

- [x] 5.1 `npm run build`
```

### sort-deferment-period-options-desc

```
## 1. 实现

- [x] 1.1 `getDefermentPeriodOptions` 改为降序
- [x] 1.2 更新 proposal / design / spec
```

### split-movement-application-teacher-student

```
## 1. Mock 当前学生

- [x] 1.1 创建 `src/data/mockCurrentStudent.js`：`getCurrentStudent()`、`MOCK_CURRENT_STUDENT_ID`（选用 seed 中有申请记录的学生）
- [x] 1.2 确认 mock 学生在 `initialStudents` 中存在且四 Tab store 有对应申请便于冒烟

## 2. StudentSelectModal

- [x] 2.1 创建 `StudentSelectModal.vue`（参考 `CourseSelectModal.vue`）
- [x] 2.2 搜索：学号 / 姓名 / 中文名 keyword 过滤
- [x] 2.3 表格列：学号、姓名；单选 + Confirm/Cancel
- [x] 2.4 集成分页 `TablePagination`，默认 pageSize 10
- [x] 2.5 i18n：`studentSelect.*`（zh / en）

## 3. 菜单、路由、i18n

- [x] 3.1 `studentRecordsMenu.js`：`sr-movement-application-teacher`、`sr-movement-application-student` 替换原 `sr-movement-application`
- [x] 3.2 `studentRecordsDevelopedPages` 注册两个新 pageId
- [x] 3.3 `App.vue`：双 `v-else-if` 渲染 `StudentMovementApplicationView`，分别传 `applicant-mode="teacher"` / `"student"`
- [x] 3.4 i18n：`menu.srMovementApplicationTeacher`、`menu.srMovementApplicationStudent`（zh / en）
- [x] 3.5 面包屑：`buildStudentRecordsBreadcrumbKeys` 对新 pageId 正常

## 4. 壳层与列表 View

- [x] 4.1 `StudentMovementApplicationView.vue`：接收 `applicantMode` prop，透传四 embedded View
- [x] 4.2 `ProgrammeTransferView.vue`：prop `applicantMode`；student 模式列表按 `getCurrentStudent().studentId` 过滤
- [x] 4.3 `DefermentView.vue`：同上
- [x] 4.4 `ResumptionView.vue`：同上
- [x] 4.5 `WithdrawalView.vue`：同上
- [x] 4.6 四 View 向 FormModal 透传 `applicantMode`

## 5. FormModal Section I（四异动）

- [x] 5.1 `ProgrammeTransferFormModal.vue`：teacher create 用 StudentSelectModal；student create 自动填充只读；draft 身份锁定
- [x] 5.2 `DefermentFormModal.vue`：同上
- [x] 5.3 `Resum
```

### unify-movement-date-format

```
## 1. 工具函数
- [x] 1.1 创建 `src/utils/formatMovementDate.js`（`formatMovementDate`、`formatMovementDateOrEmpty`）

## 2. 四 Tab 申请 data 层

- [x] 2.1 `deferments.js`：`formatApplicationDateDisplay`、`formatDefermentListDate` 委托 helper
- [x] 2.2 `programmeTransfers.js`：`formatTransferListDate` 委托 helper
- [x] 2.3 `withdrawals.js`：`formatApplicationDateDisplay`、`formatWithdrawalListDate` 委托 helper
- [x] 2.4 `resumptions.js`：`formatApplicationDateDisplay`、`formatResumptionListDate` 委托 helper

## 3. 审批 / 维护 / 查询

- [x] 3.1 `movementApprovalQueue.js`：`formatApprovalApplicationDate` 使用 helper
- [x] 3.2 `movementMaintenanceFields.js`：`formatMovementDateDisplay` 使用 helper
- [x] 3.3 `movementApprovalEngine.js`：log `dateTime` 写入 `YYYY-MM-DD`

## 4. UI 与 Export

- [x] 4.1 四 Tab `*FormModal.vue` / `*DetailModal.vue`：只读日期展示确认走 helper
- [x] 4.2 `ApprovalLogModal.vue`：`dateTime` 列 `formatMovementDate`
- [x] 4.3 `exportMovementQueryExcel.js`、`exportMovementApprovalExcel.js`：日期列 helper
- [x] 4.4 （若有）统计 export 日期列 — 无日期列，跳过

## 5. 验证

- [x] 5.1 冒烟：申请列表 / 审批列表 / 维护异动日期均为 `YYYY-MM-DD`
- [x] 5.2 冒烟：Form/Detail 申请日期、Approval log 为 `YYYY-MM-DD`
- [x] 5.3 冒烟：Export xlsx 日期列格式一致
- [x] 5.4 `npm run build` 通过

## 6. §17 转专业 Section VII 申请侧置灰

- [x] 6.1 `ProgrammeTransferFormModal.vue`：Section VII 三个控件 `disabled` + 置灰样式 class
- [x] 6.2 确认 Submit / Save Draft 不校验 Section VII；payload 不写入申请侧 admin 字段
- [x] 6.3 冒烟：新建/编辑表单 Section VII 可见不可点；Detail / 审批页无回归

## 7. §18 生效学期列统一 YYYY/MM

- [x] 7.1 新增 `formatEffectiveSessi
```

### unify-movement-declaration-section

```
# 任务
- [x] 1. MovementDeclarationSection 组件
- [x] 2. 四类型 FormModal + 移除家长下载
- [x] 3. deferments 数据与校验 + mock
- [x] 4. 详情 MovementDetailContent / DetailModal
- [x] 5. i18n + npm run build
```

### update-movement-application-details

```
## 1. 共享附件只读组件

- [x] 1.1 创建 `MovementAttachmentReadonly.vue`：边框容器、标签行（Upload Attachment *）、右侧 Download Consent Letter、下方文件图标+蓝色链接
- [x] 1.2 实现 mock 行为：Download Consent Letter → alert hint；文件名点击 → preview 占位提示
- [x] 1.3 props 支持各模块 i18n key（labelKey / downloadLabelKey / consentHintKey）

## 2. 转专业详情 Modal

- [x] 2.1 `ProgrammeTransferDetailModal.vue`：移除 approval-box、ConfirmDialog、approval 相关 script/import
- [x] 2.2 移除 Section VII 整块及 `adminForm` / `showSectionSevenEdit`
- [x] 2.3 移除 meta 行 `approvalStage`；移除 header `officeSubtitle`（可选）
- [x] 2.4 Documents Section 改用 `MovementAttachmentReadonly`
- [x] 2.5 `ProgrammeTransferView.vue`：移除 `@approve` / `handleApprove`

## 3. 休学 / 复学 / 退学详情 Modal

- [x] 3.1 `DefermentDetailModal.vue`：移除审批区；Documents 改用共享组件；移除 approvalStage
- [x] 3.2 `ResumptionDetailModal.vue`：同上
- [x] 3.3 `WithdrawalDetailModal.vue`：同上
- [x] 3.4 三 View：移除 `@approve` / `handleApprove`

## 4. 表单附件区布局（对齐图示，可选一致化）

- [x] 4.1 四 `*FormModal.vue`：`documents-row` 调整为标签+Download 同行、Select File 在下方（与只读组件视觉统一）
- [x] 4.2 确认 Form 校验与 Select File 行为不变

## 5. i18n

- [x] 5.1 确认各模块 `uploadAttachment` / `downloadConsent` / `consentLetterHint` key 可被共享组件使用
- [x] 5.2 如需新增 `movementAttachment.previewHint` 等共享 key，同步 `zh.js` / `en.js`（使用 `common.attachmentPreviewHint`）

## 6. 验证

- [x] 6.1 冒烟：四模块 Details 无审批 UI、无 Section VII（转专业）、字段与 Form 一致
- [x] 6.2 冒烟：附件区布局对齐图示；Download Consent Letter 可点击
- [x] 6.3 冒烟：列表流转日志仍正常；Edit/Resubmit/Cancel 等申请侧操作不受影响
- [x] 6.4 `npm run build` 通过

## 7. Open
```

### add-student-select-programme-level-column（增量）

```
## 1. StudentSelectModal 专业层次列

- [x] 1.1 `StudentSelectModal.vue`：表头与表体增加「专业层次」列（置于专业与学院之间）；单元格固定展示 i18n 文案「本科」/ Undergraduate（策略 B，不读学籍真实层次）
- [x] 1.2 空状态 `colspan` 由 6 调整为 7
- [x] 1.3 i18n：`studentSelect.columns.programmeLevel`、`studentSelect.defaultProgrammeLevel`（zh / en）

## 2. 验证

- [x] 2.1 冒烟：转专业 / 休学 / 复学 / 退学管理端新建 → 选择学生弹框均出现专业层次列且值为本科

## 3. 文案修正与横向滚动

- [x] 3.1 `defaultProgrammeLevel`：中文「本科学生」→「本科」，英文 `Undergraduate Student` → `Undergraduate`；同步 proposal/design/spec
- [x] 3.2 `StudentSelectModal`：去掉专业/学院 ellipsis 截断，表设 min-width，table-wrap 可横向滚动看全字段
- [x] 3.3 冒烟：长专业名可左右滑动看全；专业层次显示「本科」

## 4. 国籍列

- [x] 4.1 `StudentSelectModal`：normalize 增加 nationality；列置于姓名与专业之间；中文用 `tr()` 显示国名、英文显示原文；空值 `—`；colspan 7→8
- [x] 4.2 i18n：`studentSelect.columns.nationality`（zh / en）
- [x] 4.3 冒烟：四类异动选择学生弹框均含国籍列，中/英切换展示正确

## 5. 退学附件图示3（马/中/其他统一）

- [x] 5.1 `movementAttachments.js`：扩展 accommodationCheckOut / medicalRecord / otherDocuments；`getWithdrawalDocumentFields` 固定图示3清单；休学/复学字段逻辑不变
- [x] 5.2 `MovementDocumentsUploadSection`：支持 Other Documents 多行 + Add More Files；保持自定义选择按钮
- [x] 5.3 `MovementAttachmentsReadonly` + 导出标签同步新槽位
- [x] 5.4 `WithdrawalFormModal`：切换学生清空附件并 alert 提示；i18n 文案
- [x] 5.5 冒烟：退学表单见完整清单；提交缺机票失败；换学生后附件清空有提示

## 6. Other Documents 交互与中文标签

- [x] 6.1 `otherDocuments` 默认 1 行（minSlots=1）；第 2 行起显示关闭按钮可删除
- [x] 6.2 zh i18n：住宿退宿表 / 机票（国际学生）/ 病历 / 其他附件 / 添加更多文件
- [x] 6.3 确认学生端与管理端共用同一附件清单（无需另改 View）

## 7. 休学附件图示1–3（按国家）

- [x] 7.1 `getDefermentDocumentFields` + `resolveAttachmentNationGroup`：马来无机票；中国/其他含机票（可选）
- [x] 7.2 上传/只读/校验传入 nationality；`DefermentFormModal` 接线 + 换学生清空提示
- [x] 7.3 i18n：`medicalRecordOptional`；学生端随本人国籍同步（共用 FormModal）

## 8. 复学附件图示1–3（按国家）

- [x] 8.1 `getResumptionDocumentFields`：马来无签证；中国/其他签证相关* + 医疗康复可选 + 其他附件；新槽 `visaRelatedDocuments`
- [x] 8.2 `ResumptionFormModal` 传 nationality；换学生清空提示；只读/导出/i18n 同步
- [x] 8.3 学生端共用 FormModal，随本人国籍同步清单
```
