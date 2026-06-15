## Why

`add-programme-transfer-app` 及休学/复学/退学模块在 Phase 4 已将 **流转日志** 外置至列表 Actions，但 **详情 Modal** 仍内嵌审批操作区（Action / Comment / Submit）及转专业 **Section VII（教务专用）** 可编辑区。产品 IA 已重组：`学籍异动申请` Tab 负责学生侧申请，`学籍异动审批` 将独立建设审批能力。

当前详情与职责边界冲突——学生在申请模块详情里不应看到或执行审批；详情应 **只读展示与「新增/编辑表单」一致的申请内容**，附件区需对齐原型图示（标签 + Download Consent Letter + 已上传文件链接）。

## What Changes

### 详情 Modal 职责收窄（四异动统一）

- **移除** 四模块 `*DetailModal.vue` 内：
  - 审批表单区（`approval-box`、Action/Comment/常用语/Submit）
  - 审批确认 `ConfirmDialog`
  - 相关 script：`approvalAction*`、`canApprove*`、`applyApprovalDecisionToItem` 等 import
  - `emit('approve')` 及父 View 的 `@approve` 绑定（保留 data 层 `*Approval.js` 供未来审批模块）
- **移除** meta 行中的 `approvalStage` 展示（审批信息改由流转日志 / 未来审批模块承载）
- **保留** meta 行：Application ID、Status 徽章（列表上下文）
- **保留** footer：Close；Draft / Update Required 的 Edit 入口（若现有）

### 转专业详情额外移除

- **移除 Section VII**（For Academic Affairs Office Only）只读/可编辑块——不属于学生申请内容
- **移除** `officeSubtitle` 等暗示教务审批的 header 副标题（可选改为纯申请标题）

### 详情字段范围 = 新增表单 Section

| 模块 | 详情保留 Section |
|------|------------------|
| Programme Transfer | I Student Details、II Transfer Info、III Declaration、IV Documents |
| Deferment | Student Info、Student Application、Parent Consent、Documents |
| Resumption | Student Info、Resumption Details、Documents、Declaration |
| Withdrawal | Student Info、Student Application、Parent Consent、Documents |

### 附件只读组件（对齐图示）

- **新增** 共享组件 `MovementAttachmentReadonly.vue`（或等效命名）
- 布局：
  - 外框：浅灰边框圆角容器
  - 首行：左 `Upload Attachment * :` 标签；右 `Download Consent Letter` 描边按钮（带下载图标）
  - 次行：文档图标 + 蓝色文件名链接（无附件时占位 `—`）
- 四模块 `*DetailModal` 的 Documents Section 改用该组件
- **Download Consent Letter**：只读 mock（`window.alert` 或现有 hint），与 Form 行为一致

### 表单附件区布局对齐（可选一致化）

- 四模块 `*FormModal` 的 `documents-row` 调整为与图示一致的 **标签行 + 下载按钮同行、文件信息在下方**，与详情视觉统一（Select File 仍保留在 Form 可编辑场景）

### 不变

- 列表 **流转日志**（`ApprovalLogModal`）保留
- 列表 CRUD、6 态、状态机、mock 数据与 `*Approval.js` 逻辑保留（供未来 `sr-movement-approval`）
- Form Modal 的 Section VII（转专业）在 **新建/编辑** 仍可见（仅详情不展示）

## Capabilities

### New Capabilities

- `movement-application-details`: 学籍异动申请详情只读展示规范（字段范围、附件 UI、无审批）

### Modified Capabilities

- `programme-transfer-app`: 详情移除审批与 Section VII；附件 UI 更新
- `student-records-app`: 四异动详情行为与 IA 一致（申请 vs 审批分离）

## Impact

- **新增** `src/components/studentRecords/MovementAttachmentReadonly.vue`
- **修改** 四模块 `*DetailModal.vue` — 精简为申请只读 + 新附件组件
- **修改** 四模块 `*View.vue` — 移除 `@approve` / `handleApprove` 与 Detail 的连接（handler 可删或留空）
- **可选修改** 四模块 `*FormModal.vue` — documents-row 布局对齐图示
- **i18n**：如需 `movementAttachment.*` 共享 key
- **OpenSpec 下游**：`add-programme-transfer-app` proposal Phase 4「Pending 审批区保留」作废，以本 change 为准

## Non-goals

- 实现 `学籍异动审批` 菜单页
- 删除 `*Approval.js` 或 mock 审批流数据
- 修改 `ApprovalLogModal` 内容
- 变更列表 Actions 集合（除移除详情内审批外）
