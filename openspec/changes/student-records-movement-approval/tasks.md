# 学籍管理-异动审批 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-movement-admin-cancel

```
## 1. 数据与 i18n

- [x] 1.1 新建 `movementApplicationCancel.js`（canAdminCancel / applyAdminCancel）
- [x] 1.2 四类 `cancelApplication` log comment 区分 Student / AC
- [x] 1.3 `movementAdminCancel.*` i18n；转专业 `cancelApplication` 中文改为「撤销」

## 2. 界面
- [x] 2.1 新建 `MovementAdminCancelAction.vue`（tooltip + ConfirmDialog）
- [x] 2.2 接入 Query / Maintenance / Approval 列表 Actions

## 3. 验证

- [x] 3.1 `npm run build`
```

### add-movement-approval-app

```
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
- [x] 6
```

### add-movement-approval-list-columns-and-documents-hint

```
## 1. 审批列表数据

- [x] 1.1 queue 衍生 historicalApplicationSequence / lastApprovalActionTime
- [x] 1.2 i18n 列名

## 2. 审批 UI 与导出

- [x] 2.1 MovementApprovalView 主表两列（异动类别后）
- [x] 2.2 export 字段与 formatApprovalExportRow

## 3. 附件 hint

- [x] 3.1 MovementDocumentsUploadSection 布局与样式

## 4. Tooltip 与规则细化

- [x] 4.1 表头 tooltip 组件与 columnHints i18n
- [x] 4.2 退学纳入申请次序；无审批 Last Action Time 显示 —

## 5. 验证

- [x] 5.1 npm run build
```

### add-movement-approval-log-parallel-branches

```
## 1. 构建与 UI

- [x] 1.1 timeline 构建支持 parallelGroups
- [x] 1.2 ApprovalTimeline 分支渲染与样式
- [x] 1.3 i18n branchStart / branchJoin

## 2. Demo

- [x] 2.1 休学 DEF016 会签混态样例

## 3. 规格

- [x] 3.1 proposal / design / spec
```

### inline-movement-approval-search-fields

```
## 1. 移除 scoped 搜索样式覆盖

- [x] 1.1 删除 `MovementApprovalView.vue` scoped 中 `.search-fields` grid 定义
- [x] 1.2 删除 `.search-item { flex-direction: column }` 及 label 纵向样式
- [x] 1.3 删除重复的 `.search-input` / `.search-select` / `.search-row` / `.search-actions` 规则（改由 `list-page-search.css` 生效）

## 2. 对齐全局搜索布局

- [x] 2.1 确认模板使用 `search-bar` > `search-row` > `search-fields` + `search-actions` 结构（已满足则不改）
- [x] 2.2 目视对比 `CourseApprovalView`：标签与输入框同一行、Search/Reset 右上

## 3. 验证

- [x] 3.1 冒烟：5 字段均为「标签 + 控件」同行，标签不换行到输入框上方
- [x] 3.2 冒烟：窄屏时字段组可换行，组内仍同行
- [x] 3.3 `npm run build` 通过
```

### refine-movement-admin-cancel-to-approval-history

```
## 1. 审批历史 Tab

- [x] 1.1 `MovementApprovalView` 历史 Tab 列表行增加 `MovementAdminCancelAction`

## 2. 移除旧入口

- [x] 2.1 四类申请管理端列表移除撤销
- [x] 2.2 `MovementMaintenanceView` 移除撤销

## 3. 组件与 i18n

- [x] 3.1 `MovementAdminCancelAction` entryPoint `approval-history` + tooltip
- [x] 3.2 更新 `movementStudentCancel.tooltipItem3`

## 4. 验证

- [x] 4.1 `npm run build`
```

### refine-movement-admin-detail-export

```
## 1. 工具与数据

- [x] 1.1 `movementApprovalLogDisplay.js` + `movementExportNames.js`
- [x] 1.2 mock `exportArchiveNumber` / `attachments` / `actorRole`

## 2. 界面
- [x] 2.1 `MovementApprovalLogTable.vue`
- [x] 2.2 抽屉布局 + 附件 Export
- [x] 2.3 管理端 `enableExportPdf` + PDF 导出
- [x] 2.4 详情隐藏下载同意书；声明勾选蓝色只读；Footer 按钮顺序

## 3. 验证

- [x] 3.1 `npm run build`
```

### refine-movement-approval-search-ui

```
## 1. 默认角色常量

- [x] 1.1 在 `movementApprovalEngine.js`（或同级常量文件）导出 `DEFAULT_APPROVER_ROLE = 'Pending Review'`
- [x] 1.2 `MovementApprovalView.vue` 使用该常量替代 `ref('Pending Review')` 与 Role 下拉

## 2. 移除 Role 选择器

- [x] 2.1 删除 `role-bar` 模板块（label + select）
- [x] 2.2 删除 `approverRoleOptions` import、`watch(currentRole)` 及相关样式
- [x] 2.3 `MovementApprovalReviewView` 仍接收 `:current-role="currentRole"`（常量）

## 3. 搜索区自适应布局

- [x] 3.1 合并 5 个搜索字段至单一 `.search-fields` 栅格（移除 secondary 展开行）
- [x] 3.2 删除 `searchExpanded`、`toggleSearchExpanded`、Collapse/More 按钮
- [x] 3.3 CSS：`grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` + 右侧 Search/Reset 固定操作列
- [x] 3.4 Tab 栏置于搜索区上方（与图示一致）

## 4. i18n 清理（可选）

- [x] 4.1 确认无 UI 引用 `movementApproval.currentRole`（可保留 key 或删除）

## 5. 验证

- [x] 5.1 冒烟：页面无 Current approver role；Tab/列表/审批仍按 Pending Review 分桶
- [x] 5.2 冒烟：5 搜索字段常显；缩放窗口字段自适应换行
- [x] 5.3 `npm run build` 通过

## 6. Tab 顺序与角标

- [x] 6.1 `APPROVAL_TABS` 顺序改为 pending → submitted → history
- [x] 6.2 仅 pending Tab 渲染 `tab-count` 角标

## 7. 表格列与状态展示

- [x] 7.1 修复 Status badge CSS（引入 status-* 背景色）；`statusLabel` 补 `Expired`
- [x] 7.2 移除异动原因列；新增申请日期列 + i18n
- [x] 7.3 `movementApprovalQueue.js`：`formatApprovalApplicationDate(sourceKey, item)` + `applicationDateDisplay`
- [x] 7.4 历史 Tab 才显示「是否实施」列；`formatImplementedYn`：Implemented→Y，其余→N
- [x] 7.5 动态 colspan；export CSV 列同步

## 8. 搜索精简

- [x] 8.1 移除异动原因搜索项；`createEmptySearch` / `filterBySearch` 去掉 `movementReason`
- [x] 8.2 搜索区改为 4 字段自适应栅格

## 9. Mock seed
```

### refine-movement-approval-stage-department-labels

```
## 1. 映射与展示

- [x] 1.1 导出 STAGE_ROLE_MAP + `formatApprovalStageLabel`
- [x] 1.2 列表 / 时间轴 / 导出接入
- [x] 1.3 zh-flat 部门名直译
- [x] 1.4 proposal / design / spec
```

### refine-movement-cancel-entry-points

```
## 1. 入口收窄

- [x] 1.1 Query / Approval 移除 `MovementAdminCancelAction`
- [x] 1.2 Maintenance 保留 Admin 撤销

## 2. 学生取消

- [x] 2.1 新建 `MovementStudentCancelAction.vue` + `movementStudentCancel.*` i18n
- [x] 2.2 四类 `*View.vue` 仅 `applicantMode === 'student'` 显示取消 + tooltip
- [x] 2.3 确认弹框改用 `movementStudentCancel.confirmMessage`
- [x] 2.4 取消 tooltip 文案：对比申请管理端「撤销」而非维护页

## 3. 管理端申请撤销

- [x] 3.1 四类 `*View.vue` 在 `applicantMode === 'teacher'` 接入 `MovementAdminCancelAction`
- [x] 3.2 更新 `movementAdminCancel` tooltip（管理端申请 + 维护页）
- [x] 3.3 tooltip 文案对齐原型（两条：入口说明 + 流程终止通知各部门）

## 4. 验证

- [x] 4.1 `npm run build`
```

### refine-movement-detail-approval-timeline

```
## 1. 共享内容片段

- [x] 1.1 新增 `MovementDetailExportBody.vue`（流程图在上 + 申请在下）

## 2. 详情与 PDF

- [x] 2.1 `MovementApplicationDetailDrawer` 改用共享片段，移除表格
- [x] 2.2 `MovementDetailPdfPreviewModal` 改用共享片段，移除表格

## 3. 验证

- [x] 3.1 `npm run build`
```

### remove-movement-approval-last-action-time-column

```
## 1. 列表与导出

- [x] 1.1 `MovementApprovalView` 移除最近审核时间列
- [x] 1.2 导出字段与 `formatApprovalExportRow` 移除 `lastApprovalActionTime`

## 2. 数据层清理

- [x] 2.1 `movementApprovalQueue` 停止衍生 `lastApprovalActionTime`
- [x] 2.2 删除 `resolveLastApprovalActionTime`

## 3. 验证

- [x] 3.1 `npm run build`
```

### restore-movement-approval-last-action-time-column

```
## 1. Workflow 与时间解析

- [x] 1.1 `getParallelGroups` / `getPreviousLogicalNodeStages`
- [x] 1.2 `resolveLastApprovalActionTime(item, ctx)` 前一节点语义
- [x] 1.3 queue 传入 sourceKey + category

## 2. UI / 导出 / 文案

- [x] 2.1 列表列与导出（既有）
- [x] 2.2 columnHints 更新中英文

## 3. 规格

- [x] 3.1 proposal / design / spec
```
