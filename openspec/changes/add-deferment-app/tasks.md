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
- [x] 8.2 实现 `getMainReasonLabel`
- [x] 8.3 补充 `zh-flat.js` flat 中文映射

## 9. 6 态状态机升级（Phase 3）

- [x] 9.1 扩展 `deferments.js`：status 枚举改为 Draft / In Progress / Update Required / Approved / Rejected / Cancelled；`ACTIVE_STATUSES`、`archived` 规则
- [x] 9.2 实现 helper：`canEditDeferment`、`canDeleteDeferment`、`canCancelDeferment`、`canResubmitDeferment`、`canApproveDeferment`、`hasActiveDefermentForStudent`
- [x] 9.3 实现状态变更：`saveDraftApplication`、`submitApplication`、`cancelApplication`、`resubmitApplication`；`validateDefermentForm(data, mode)`
- [x] 9.4 升级 `defermentApproval.js`：多段 `STAGE_FLOW`、Approved / Update Required / Rejected
- [x] 9.5 升级 `DefermentFormModal.vue`：Create/Edit 共用；Save Draft / Submit / Resubmit Footer
- [x] 9.6 升级 `DefermentView.vue`：状态驱动 Actions（Edit / Delete / Cancel / Resubmit）
- [x] 9.7 升级 `DefermentDetailModal.vue`：In Progress 审批区（Approved / Update Required / Rejected）
- [x] 9.8 i18n：6 态徽章 + Save Draft / Cancel / Resubmit / Edit / Delete（en/zh/zh-flat）
- [x] 9.9 扩展 `initialDeferments`：6 态各 ≥2 条（≥12 条）；更新 `nextId` / `nextAppSeq`（DEF003–DEF014）
- [x] 9.10 冒烟：Draft Edit/Delete；Pending Review Cancel；Update Required Edit+Resubmit；终态只读；`npm run build` 通过

## 10. 流程日志外置（Phase 4）

- [x] 10.1 复用 `ApprovalLogModal.vue`
- [x] 10.2 `DefermentView`：Actions 增加流转日志；接入 ApprovalLogModal
- [x] 10.3 `DefermentDetailModal`：移除内嵌 approvalLog（若 Phase 3 重构后需再确认）
- [x] 10.4 i18n：`common.workflowLog`（en/zh）
- [x] 10.5 Phase 3 完成后复验：各状态均有流转日志；详情无 log 区；`npm run build` 通过
