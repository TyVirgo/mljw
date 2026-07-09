## 背景与动机

学籍异动与课程申请/审批/维护/查询等模块在列表操作栏普遍提供 **「查看/详情」** 与 **「日志/流转日志/Approval Log」** 两个独立入口，分别打开居中弹窗或整页审阅视图。用户需要在同一上下文内对照审批进度与申请内容。产品后续原型要求日志以 **四列表格**（Description、Action By、Action By Role、Created At）展示，且申请详情位于审批日志之上。当前实现分散、交互不一致，维护成本高。

## 变更内容

### 统一入口

- 凡列表同时存在「详情类」与「日志类」按钮的页面，**合并为单一「详情」按钮**
- **不合并** Edit、Delete、Cancel、Submit、Export 等其他行内操作；这些按钮保留在列表操作栏

### 统一容器：右滑抽屉

- 点击「详情」→ 抽屉从 **右向左** 滑入（参考 `StudentProfileDetailDrawer`）
- 列表页保持可见（不再整页替换为 `MovementApprovalReviewView`）
- 布局（自上而下）：
  1. **固定顶栏**：标题 + 关闭
  2. **可滚动内容区**：上 — 申请 **详情字段**；下 — **Approval Log 四列表格**
  3. **固定底栏**：场景相关操作（Close、Review/Approve、Recall 等）；仅中间内容区滚动

### 审批日志表格

- 新建 `MovementApprovalLogTable.vue`（或等价表格组件），在抽屉内替代独立 `ApprovalLogModal` 与纵向时间线
- 列：Description、Action By、Action By Role、Created At；Submitted 条目 Description 为 Application Submitted
- Created At 格式：`YYYY-MM-DD HH:mm:ss`
- 异动：按 `approvalLog` 顺序渲染；课程：沿用现有日志数据结构

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

## 能力范围

### 新增能力

- `application-detail-drawer`: 通用右滑抽屉壳、审批日志表格、footer 插槽约定

### 修改的能力

- `movement-application-details`: 详情内容从 Modal overlay 拆为 drawer 内嵌；附件预览等行为不变
- `movement-approval-app`: View + Log 合并；Pending tab 审批入口在抽屉 footer
- `movement-query-app`: Details + Log 合并；列表保持；敏感字段脱敏透传
- `movement-maintenance`: Details + Log 合并；Edit 仍留列表
- `deferment-app` / `programme-transfer-app` / `resumption-app` / `withdrawal-app`: 学生端 Actions 合并详情与日志
- `course-application` / `course-change-application`: Details + Approval Log 合并为详情抽屉

## 影响范围

- **新增**
  - `src/components/common/ApplicationDetailDrawer.vue`（或 `common/` + 领域 thin wrapper）
  - `src/components/studentRecords/MovementApprovalLogTable.vue`（或等价审批日志表格）
  - `src/utils/movementApprovalLogDisplay.js`（日志展示辅助）
  - `MovementApplicationDetailDrawer.vue` — 异动四类详情 + 审批日志表格组装
  - `CourseApplicationDetailDrawer.vue` — 课程/变更详情 + 审批日志表格组装（可选与异动共用壳）
- **修改**
  - 11 个列表 View（见上）
  - 4 个 `*DetailModal.vue` — 拆出 `*DetailContent.vue`（无 overlay/footer）
  - `MovementApprovalReviewView.vue` — 废弃整页模式或降级为 drawer 内容适配层
- **废弃/降级**
  - 各 View 独立挂载的 `ApprovalLogModal`（无其他入口时可保留组件供遗留引用，但列表不再使用）
- **非目标（本变更不做）**
  - 抽屉内记录翻页（图示右箭头）— 二期
  - 修改审批流定义或 mock 写回逻辑
  - 统计页等无详情+日志双按钮的页面

---

## 关联变更（2026-06-30 原型补档）

| 变更 | 关系 |
|------|------|
| `refine-movement-admin-detail-export` | 抽屉布局改为详情在上、审批日志表格在下；管理端 Export PDF；详情隐藏同意书模板下载 |
| `refine-approval-modal-action-labels` | 抽屉 footer「Review/Approve」打开的 `MovementApprovalModal` / `CourseApprovalModal` Action 文案统一为 通过/不通过/驳回 |
| `add-attachment-online-preview` | 抽屉内详情区附件仍走 `MovementAttachmentReadonly` + 👁 预览 |

## 验证状态（2026-06-30）

- 实现任务 §1–§7 已完成；`tasks.md` §8.5 build 已通过
- §8.3 / §8.4 全量 11 页回归仍待人工冒烟
