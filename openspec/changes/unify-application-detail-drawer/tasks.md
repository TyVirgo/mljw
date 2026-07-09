## 1. 基础组件

- [x] 1.1 新建 `src/utils/buildApprovalTimelineNodes.js`：workflowStages + approvalLog + currentStage + status → timeline nodes
- [x] 1.2 新建 `src/components/common/ApprovalTimeline.vue`：竖向时间线 UI（图标、阶段、处理人、状态徽章、时间、comment 可选）
- [x] 1.3 新建 `src/components/common/ApplicationDetailDrawer.vue`：右滑壳（header / scroll-body / footer slot）；参考 `StudentProfileDetailDrawer`
- [x] 1.4 i18n：`approvalTimeline.*` 状态徽章；时间线区标题；确认「详情」按钮文案统一

## 2. 异动详情内容拆分

- [x] 2.1 从 `DefermentDetailModal.vue` 拆出 `DefermentDetailContent.vue`（无 overlay/footer）— 已用 `MovementDetailContent.vue` 统一替代
- [x] 2.2 从 `ProgrammeTransferDetailModal.vue` 拆出 `ProgrammeTransferDetailContent.vue` — 同上
- [x] 2.3 从 `ResumptionDetailModal.vue` 拆出 `ResumptionDetailContent.vue` — 同上
- [x] 2.4 从 `WithdrawalDetailModal.vue` 拆出 `WithdrawalDetailContent.vue` — 同上
- [x] 2.5 新建 `MovementApplicationDetailDrawer.vue`：组装 timeline + 四类 DetailContent + footer（Close / Review / Recall）
- [x] 2.6 透传 `maskSensitiveFields`、`showApprovalAction` 等现有 props

## 3. 管理端异动 — 查询试点

- [x] 3.1 `MovementQueryView.vue`：Details + Approval Log → 单一 Details；接入 `MovementApplicationDetailDrawer`
- [x] 3.2 移除 `viewMode === 'review'` 整页 `MovementApprovalReviewView` 分支
- [x] 3.3 移除 `ApprovalLogModal` 引用；`:mask-sensitive-fields="true"`

## 4. 管理端异动 — 审批

- [x] 4.1 `MovementApprovalView.vue`：View + Approval Log → Details 抽屉
- [x] 4.2 Pending tab footer Review → `MovementApprovalModal`；History tab Recall
- [x] 4.3 移除整页 ReviewView 与独立 ApprovalLogModal

## 5. 管理端异动 — 维护

- [x] 5.1 `MovementMaintenanceView.vue`：Details + Approval Log → Details 抽屉
- [x] 5.2 Edit 保留列表；移除 ReviewView / ApprovalLogModal

## 6. 学生端异动四 Tab

- [x] 6.1 `DefermentView.vue`：移除流转日志；Details 改抽屉
- [x] 6.2 `ProgrammeTransferView.vue`
- [x] 6.3 `ResumptionView.vue`
- [x] 6.4 `WithdrawalView.vue`
- [x] 6.5 Edit / Delete / Cancel 保留列表操作栏

## 7. 课程模块

- [x] 7.1 梳理课程详情只读内容来源（Wizard readonly / 现有 detail 组件）
- [x] 7.2 新建 `CourseApplicationDetailDrawer.vue`（或共用壳 + 课程 content）
- [x] 7.3 `CourseApplicationView.vue`：Details + Approval Log 合并
- [x] 7.4 `CourseChangeApplicationView.vue`
- [x] 7.5 `CourseApprovalView.vue`：footer Approve
- [x] 7.6 `CourseChangeReviewView.vue`

## 8. 清理与验证

- [x] 8.1 评估 `MovementApprovalReviewView.vue`：删除或保留为 drawer 适配层 — 列表侧已无引用，文件保留
- [x] 8.2 `ApprovalLogModal.vue`（studentRecords / courseApplication）：列表侧零引用；组件可保留
- [ ] 8.3 回归 11 个页面：抽屉开关、审批日志表格、footer 按钮、附件预览
- [ ] 8.4 回归：Edit/Delete/Cancel 等列表按钮未受影响
- [x] 8.5 Node 18+ 环境 `npm run build`（2026-06-30 验证通过）
