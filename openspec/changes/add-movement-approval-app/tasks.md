## 1. 数据层 — 队列与流程

- [x] 1.1 创建 `movementApprovalWorkflows.js`：四异动 + Local/Intl 分支 stage 序（v1 串行化并行块）
- [x] 1.2 创建 `movementApprovalEngine.js`：`classifyApprovalBucket`、`applyDecision`、`recallDecision`、`getActiveStageForRole`
- [x] 1.3 创建 `movementApprovalQueue.js`：四 store 归一化、`mergeMovementApprovalQueue`、Tab/搜索过滤
- [x] 1.4 扩展 mock：补 `applicationSession`、`effectiveSession`、`implemented`；In Progress 记录覆盖多 stage 便于三 Tab demo

## 2. 审批列表页

- [x] 2.1 创建 `MovementApprovalView.vue`：三 Tab（Submitted / Pending / History）+ Role 下拉
- [x] 2.2 搜索区：Academic Session、异动原因、Status、Student ID、Student Name
- [x] 2.3 共性表格列 + 勾选 + 分页；Actions：View | Approval log
- [x] 2.4 Pending Tab：Approve + Export；Submitted/History 隐藏 Approve
- [x] 2.5 批量 Approve：同 `sourceKey` + 同 `approvalStage` 校验

## 3. 审批详情与 Modal

- [x] 3.1 创建 `MovementApprovalDetailPanel.vue`（或 Modal）：`mode=readonly|approve|history`
- [x] 3.2 readonly：嵌入/复用四异动申请只读内容（与 `*DetailModal` 一致）
- [x] 3.3 approve：只读申请 + Action/Comment/Submit；转专业 Section VII
- [x] 3.4 创建 `MovementApprovalModal.vue`：批量审批（参考 `CourseApprovalModal`）
- [x] 3.5 history：Recall 按钮 + 条件判断 + confirm

## 4. 集成

- [x] 4.1 `App.vue` 注册 `MovementApprovalView`；`isMovementApproval` 分支
- [x] 4.2 `studentRecordsDevelopedPages` 加入 `sr-movement-approval`
- [x] 4.3 审批写回四 store（与申请 Tab 列表同步）；复用 `ApprovalLogModal`

## 5. i18n

- [x] 5.1 新增 `movementApproval.*`：Tab、表头、阶段名、Recall、Role 标签
- [x] 5.2 同步 `zh.js` / `en.js`

## 6. 验证

- [x] 6.1 冒烟：切换 Role → Submitted/Pending/History 列表变化正确
- [x] 6.2 冒烟：Pending View 审批 → stage 推进 + log 写入；申请 Tab 列表同步
- [x] 6.3 冒烟：Submitted View 只读无审批；Cancelled 进 History
- [x] 6.4 冒烟：Recall  eligible 项回 Pending；Approval log 正常
- [x] 6.5 冒烟：Intl 休学/复学/退学 mock 走 ISAO 节点
- [x] 6.6 `npm run build` 通过

## 7. 文档（可选）

- [ ] 7.1 与 `update-movement-application-details` 交叉引用：申请只读 / 审批进本模块

## 8. Export 接入 ExportModal + xlsx

- [x] 8.1 创建 `movementApprovalExportFields.js`（列表列 + 可选 `implemented`）
- [x] 8.2 创建 `exportMovementApprovalExcel.js`（或复用 `exportMovementQueryToExcel` + approval columnMeta）
- [x] 8.3 `MovementApprovalView.vue`：移除 CSV `handleExport`；接入 `ExportModal` + 三 scope
- [x] 8.4 `formatApprovalExportRow`：status/类别 i18n；implemented 可选 Y/N
- [x] 8.5 冒烟：Export 当前页/全部/选中行 → xlsx + `npm run build` 通过

## 9. 详情抽屉集成（`unify-application-detail-drawer`）

- [x] 9.1 `MovementApprovalView`：View + Log → `MovementApplicationDetailDrawer`
- [x] 9.2 Pending footer Review → `MovementApprovalModal`；移除整页 ReviewView 分支

## 10. 关联变更补档（2026-06-30）

- [x] 10.1 History Tab「是否实施」列：`ImplementedYnBadge`（见 `add-movement-maintenance` §12）
- [x] 10.2 `MovementApprovalModal` Action 文案：通过/不通过/驳回（见 `refine-approval-modal-action-labels`）
