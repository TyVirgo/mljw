## 背景与动机

`refine-movement-admin-detail-export` 将异动详情审批日志改为四列表格。产品现要求改回竖向流程图（`ApprovalTimeline`），与课程申请详情一致：**流程图在上、申请内容在下**。Preview PDF 与 Export PDF 须与详情抽屉所见一致（WYSIWYG）。

## 变更内容

- 异动详情抽屉：移除 `MovementApprovalLogTable`，改用 `ApprovalTimeline` + `buildMovementTimelineNodes`
- 布局：审批流程图在上，申请字段/附件/声明在下（对齐 `CourseApplicationDetailDrawer`）
- 抽取共享内容片段 `MovementDetailExportBody.vue`，供抽屉、Preview PDF、Export PDF 共用
- Preview PDF / Export PDF 同步替换，不再包含四列表格

## 能力范围

### 修改的能力

- `movement-application-details`：审批日志展示由表格改回流程图；布局顺序调整

## 影响范围

- **新增** `MovementDetailExportBody.vue`
- **修改** `MovementApplicationDetailDrawer.vue`、`MovementDetailPdfPreviewModal.vue`
- **保留** `MovementApprovalLogTable.vue`（列表列辅助函数仍用 `movementApprovalLogDisplay.js`，详情不再引用表格）

## 非目标

- 不改审批引擎、`approvalLog` 数据结构
- 不改课程详情（已用流程图）
- 不恢复独立 Approval Log 列表按钮
