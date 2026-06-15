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
- [x] 5.4 样式 adapt 自 `DefermentView.vue`

## 6. 路由与菜单注册

- [x] 6.1 `studentRecordsMenu.js` 加入 `sr-resumption`
- [x] 6.2 `App.vue` import `ResumptionView` + template 分支

## 7. 验证（Phase 1）

- [x] 7.1 冒烟：Submit → Pending → Approve/Reject；Student 联动；重复 Pending 校验；中/英切换
- [x] 7.2 `npm run build` 通过

## 8. 6 态状态机升级（Phase 2）

- [x] 8.1 扩展 `resumptions.js`：status 枚举改为 Draft / In Progress / Update Required / Approved / Rejected / Cancelled；`ACTIVE_STATUSES`、`archived` 规则
- [x] 8.2 实现 helper：`canEditResumption`、`canDeleteResumption`、`canCancelResumption`、`canResubmitResumption`、`canApproveResumption`、`hasActiveResumptionForStudent`
- [x] 8.3 实现状态变更：`saveDraftApplication`、`submitApplication`、`cancelApplication`、`resubmitApplication`；`validateResumptionForm(data, mode)`
- [x] 8.4 升级 `resumptionApproval.js`：多段 `STAGE_FLOW`（Pending Review → Academic Affairs → Approved）、Approved / Update Required / Rejected
- [x] 8.5 升级 `ResumptionFormModal.vue`：Create/Edit 共用；Save Draft / Submit / Resubmit Footer；draft 模式不强制双声明
- [x] 8.6 升级 `ResumptionView.vue`：状态驱动 Actions（Edit / Delete / Cancel）；ConfirmDialog 删除/撤销确认
- [x] 8.7 升级 `ResumptionDetailModal.vue`：In Progress 审批区（Approved / Update Required / Rejected）；6 态徽章文案
- [x] 8.8 i18n：6 态徽章 + Save Draft / Cancel / Resubmit / Edit / Delete / `activeApplicationExists`（en/zh/zh-flat）
- [x] 8.9 扩展 `initialResumptions`：6 态各 ≥2 条（≥12 条，RES003–RES014）；更新 `nextId` / `nextAppSeq`
- [x] 8.10 冒烟：Draft Edit/Delete；Pending Review Cancel；Update Required Edit+Resubmit；终态只读；`npm run build` 通过

## 9. 流程日志外置（Phase 3）

- [x] 9.1 复用 `ApprovalLogModal.vue`
- [x] 9.2 `ResumptionView`：Actions 增加流转日志；接入 ApprovalLogModal
- [x] 9.3 `ResumptionDetailModal`：无内嵌 approvalLog 时间线（详情仅 Section + 审批区）
- [x] 9.4 i18n：`common.workflowLog`（en/zh）
- [x] 9.5 Phase 2 完成后复验：各状态均有流转日志 + 状态驱动 Actions 并存；详情无 log 区；`npm run build` 通过
