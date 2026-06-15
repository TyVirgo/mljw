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
- [x] 3.5 实现 Section IV：附件 mock 上传（文件名/大小）+ Consent Letter 下载占位 + 格式提示
- [x] 3.6 实现 Section VII：Academic Affairs 节点条件显示（New Programme / New Intake / Date）
- [x] 3.7 实现 Footer 按模式切换：Save Draft / Submit / Save / Resubmit；集成 `validateTransferForm` 内联错误

## 4. 详情 Modal

- [x] 4.1 创建 `ProgrammeTransferDetailModal.vue`：全 Section 只读展示（approval log 外置至列表流转日志，见 Phase 4）
- [x] 4.2 在 Details 内嵌审批区：Approve / Update Required / Rejected + comment；Section VII 在 Academic Affairs 节点可编辑
- [x] 4.3 集成 `programmeTransferApproval.js` 决策逻辑与 `ConfirmDialog`

## 5. 列表页

- [x] 5.1 创建 `ProgrammeTransferView.vue`：`.page-card` 布局、keyword 搜索（Student ID or Name）、Search/Reset
- [x] 5.2 实现进行中/已归档 Tab 筛选 + Application History 表格 9 列 + 状态徽章
- [x] 5.3 实现 Toolbar `+ New Application` 与行内 Actions（Details · Edit · Delete · Cancel 按状态显隐）
- [x] 5.4 集成 `TablePagination`、`ConfirmDialog`、Form/Detail Modal；列表内存 CRUD 与审批状态更新
- [x] 5.5 样式从 `StudentProfileView.vue` adapt（`.search-bar`、`.toolbar`、`.data-table`、status badge）

## 6. 路由与菜单注册

- [x] 6.1 修改 `src/config/studentRecordsMenu.js`：`studentRecordsDevelopedPages` 加入 `sr-programme-transfer`
- [x] 6.2 修改 `src/App.vue`：import `ProgrammeTransferView`，`isProgrammeTransfer` computed + template 分支

## 7. Mock 演示与验证

- [x] 7.1 添加 Expired mock 演示入口（如 dev 按钮或超期样例记录）验证 Draft/Update Required → Expired 不可编辑
- [x] 7.2 手动冒烟：新建 Draft → Submit → Cancel / 审批 Approve·Update Required·Reject → Resubmit 全路径；Student ID 联动；菜单切换；`npm run build` 通过

## 8. 列表搜索区与 Form Section VII UI（Phase 2）

- [x] 8.1 更新 `ProgrammeTransferView.vue`：移除 `.page-title`；搜索区作为 `.page-card` 首行；label 改为 `Student ID or Name:` + 输入框 + Search/Reset（对齐 Student Profile `.search-bar`）
- [x] 8.2 补充 i18n：`programmeTransfer.searchFieldLabel`、`fields.selectProgramme`、`fields.selectIntake`（placeholder 文案）
- [x] 8.3 更新 `ProgrammeTransferFormModal.vue`：Section VII 在 Create/Edit 常显；布局 Row1 Programme+Intake、Row2 Date；placeholder 对齐图示2
- [x] 8.4 冒烟：列表无大标题、搜索首行；新建表单可见 Section VII；Details 审批区行为不变；`npm run build` 通过

## 9. 状态演示 Mock 补齐（Phase 3 — 每状态 2 条）

- [x] 9.1 更新 `programmeTransfers.js`：扩展 `initialProgrammeTransfers` — Draft ×2、In Progress ×2（含 Pending Review 可 Cancel + 审批中不可 Cancel）、Cancelled ×2、Update Required ×2、Rejected ×2、Approved ×2
- [x] 9.2 调整 `nextId` / `nextAppSeq` 与 applicationId 序列（TRF006–TRF015）；遵守「同一 studentId 仅一条非终态」规则
- [x] 9.3 为每条 mock 补充合理 `approvalLog`（Submitted / Cancelled / Update Required / Rejected / Approved 路径）
- [x] 9.4 冒烟：列表各状态 Actions 与 spec 一致（Draft Edit/Delete；Pending Review Cancel；Cancelled/Rejected/Approved 只读 Details；Update Required Edit）
- [x] 9.5 `npm run build` 通过

## 10. 流程日志外置（Phase 4 — 四模块统一，已实现）

- [x] 10.1 创建 `src/components/studentRecords/ApprovalLogModal.vue`
- [x] 10.2 `ProgrammeTransferView`：Actions 增加流转日志；接入 ApprovalLogModal；Detail 移除 log
- [x] 10.3 同步 Deferment / Resumption / Withdrawal 四模块 View + DetailModal
- [x] 10.4 i18n：`common.workflowLog`（en/zh）
- [x] 10.5 冒烟 + `npm run build` 通过
