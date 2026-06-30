## Why

学籍异动与课程申请/审批/维护/查询等模块在列表操作栏普遍提供 **「查看/详情」** 与 **「日志/流转日志/Approval Log」** 两个独立入口，分别打开居中弹窗或整页审阅视图。用户需要在同一上下文内对照审批进度与申请内容，且产品参考图要求日志以 **竖向时间线**（Submitted / Pending 状态徽章）展示。当前实现分散、交互不一致，维护成本高。

## What Changes

### 统一入口

- 凡列表同时存在「详情类」与「日志类」按钮的页面，**合并为单一「详情」按钮**
- **不合并** Edit、Delete、Cancel、Submit、Export 等其他行内操作；这些按钮保留在列表操作栏

### 统一容器：右滑抽屉

- 点击「详情」→ 抽屉从 **右向左** 滑入（参考 `StudentProfileDetailDrawer`）
- 列表页保持可见（不再整页替换为 `MovementApprovalReviewView`）
- 布局（自上而下）：
  1. **固定顶栏**：标题 + 关闭
  2. **可滚动内容区**：上 — 审批/流转 **时间线**；下 — 申请 **详情字段**
  3. **固定底栏**：场景相关操作（Close、Review/Approve、Recall 等）；仅中间内容区滚动

### 时间线

- 新建 `ApprovalTimeline.vue`，替代抽屉内的表格型 `ApprovalLogModal`
- 节点展示：阶段名、处理人、状态徽章（Submitted / Pending / Approved / Rejected 等）、时间
- 异动：结合 `getWorkflowStages(sourceKey, studentCategory)` 补全未到达节点
- 课程：结合 `approvalStageOptions` 或现有 stage 序列补全 pending 节点

### 影响页面（11 个）

**异动 — 学生端（4）**

- `DefermentView.vue`、`ProgrammeTransferView.vue`、`ResumptionView.vue`、`WithdrawalView.vue`
- 移除「流转日志」；「详情」改开抽屉

**异动 — 管理端（3）**

- `MovementApprovalView.vue` — View + Approval Log → 详情抽屉
- `MovementQueryView.vue` — Details + Approval Log → 详情抽屉
- `MovementMaintenanceView.vue` — Details + Approval Log → 详情抽屉

**课程（4）**

- `CourseApplicationView.vue`
- `CourseChangeApplicationView.vue`
- `CourseApprovalView.vue`
- `CourseChangeReviewView.vue`

## Capabilities

### New Capabilities

- `application-detail-drawer`: 通用右滑抽屉壳、时间线组件、footer 插槽约定

### Modified Capabilities

- `movement-application-details`: 详情内容从 Modal overlay 拆为 drawer 内嵌；附件预览等行为不变
- `movement-approval-app`: View + Log 合并；Pending  tab 审批入口在抽屉 footer
- `movement-query-app`: Details + Log 合并；列表保持；敏感字段脱敏透传
- `movement-maintenance`: Details + Log 合并；Edit 仍留列表
- `deferment-app` / `programme-transfer-app` / `resumption-app` / `withdrawal-app`: 学生端 Actions 合并详情与日志
- `course-application` / `course-change-application`: Details + Approval Log 合并为详情抽屉

## Impact

- **新增**
  - `src/components/common/ApplicationDetailDrawer.vue`（或 `common/` + 领域 thin wrapper）
  - `src/components/common/ApprovalTimeline.vue`
  - `src/utils/buildApprovalTimelineNodes.js`（或 `data/approvalTimeline.js`）
  - `MovementApplicationDetailDrawer.vue` — 异动四类详情 + timeline 组装
  - `CourseApplicationDetailDrawer.vue` — 课程/变更详情 + timeline 组装（可选与异动共用壳）
- **修改**
  - 11 个列表 View（见上）
  - 4 个 `*DetailModal.vue` — 拆出 `*DetailContent.vue`（无 overlay/footer）
  - `MovementApprovalReviewView.vue` — 废弃整页模式或降级为 drawer 内容适配层
- **废弃/降级**
  - 各 View 独立挂载的 `ApprovalLogModal`（无其他入口时可保留组件供遗留引用，但列表不再使用）
- **Non-goals**
  - 抽屉内记录翻页（图示右箭头）— 二期
  - 修改审批流定义或 mock 写回逻辑
  - 统计页等无详情+日志双按钮的页面
