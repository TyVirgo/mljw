## Context

当前详情与日志分离，容器形态不统一：

```
┌─────────────────────────────────────────────────────────────────┐
│  现状                                                            │
├─────────────────────────────────────────────────────────────────┤
│  学生端 4 View     [详情 Modal]  +  [流转日志 Modal]              │
│  管理 Query/Maint  整页 ReviewView +  [Approval Log Modal]        │
│  管理 Approval     整页 ReviewView +  [Approval Log Modal]        │
│  课程 4 View       [Details Modal] +  [Approval Log Modal]        │
│  日志展示          ApprovalLogModal — 5 列表格                     │
└─────────────────────────────────────────────────────────────────┘
```

目标（对齐产品参考图）：

```
列表（不动）
    │
    └── [详情] ──▶ ApplicationDetailDrawer（右滑）
                      ┌──────────────────────────────┐
                      │ 详情                     [×] │  fixed header
                      ├──────────────────────────────┤
                      │ ┌ Approval Log ────────────┐ │
                      │ │ ✓ Applicant · Submitted  │ │  scroll
                      │ │ ◷ Coordinator · Pending │ │
                      │ │ ○ HOD · —                │ │
                      │ └──────────────────────────┘ │
                      │ ──────────────────────────── │
                      │ 申请详情字段区块…             │
                      ├──────────────────────────────┤
                      │      [Close]  [Review]       │  fixed footer
                      └──────────────────────────────┘
```

已有可复用：`StudentProfileDetailDrawer`（右滑壳）、四 `*DetailModal`（字段布局）、`movementApprovalWorkflows.getWorkflowStages`、`approvalLog[]`。

## Goals / Non-Goals

**Goals:**

- 11 个页面合并「详情 + 日志」为单一「详情」按钮
- 右滑抽屉：上时间线、下详情、底固定操作
- 时间线视觉对齐参考图（竖线 + 图标 + 状态徽章 + 时间）
- 列表其他操作按钮位置与行为不变
- 异动审批 Pending tab 的 Review 在抽屉 footer

**Non-Goals:**

- 抽屉内上一条/下一条记录导航
- 改审批引擎、workflow 定义
- 无双按钮页面（如统计页、纯配置页）
- 将 Edit/Delete/Cancel 移入抽屉 footer

## Decisions

### D1：壳组件分层

```
ApplicationDetailDrawer.vue          ← 通用：overlay、panel、header、scroll-body、footer slot
    ├── ApprovalTimeline.vue         ← 通用：timeline UI
    └── slot #detail                 ← 领域内容

MovementApplicationDetailDrawer.vue  ← 组装：queueItem → timeline + *DetailContent
CourseApplicationDetailDrawer.vue    ← 组装：course item → timeline + wizard/detail readonly
```

**理由**：异动与课程详情结构差异大，共用壳 + timeline，内容分领域 wrapper。

### D2：DetailModal 拆分

每个 `*DetailModal.vue` 保留对外 API（过渡期），内部改为：

```vue
<!-- DefermentDetailModal.vue -->
<Teleport v-if="standalone">
  <div class="modal-overlay">...</div>
</Teleport>
<DefermentDetailContent v-else :item="item" ... />
```

首版实现路径：**直接新建 `*DetailContent.vue`**，Drawer 引用 Content；Modal 可 thin wrapper 或删除 Modal 仅留 Content。

**理由**：避免 drawer 嵌套 modal overlay；减少 `:deep` hack（`MovementApprovalReviewView` 当前做法）。

### D3：时间线节点构建

```js
buildApprovalTimelineNodes({
  workflowStages,   // string[] — 完整链
  approvalLog,      // { stage, actor, action, dateTime, comment }[]
  currentStage,     // item.approvalStage
  status,           // Draft | In Progress | Approved | ...
  applicantLabel,   // fullName
})
```

**节点状态映射：**

| 条件 | 图标 | 徽章 | 说明 |
|------|------|------|------|
| log 含 Submitted | ✓ | Submitted（绿） | 首节点 Applicant |
| log 含 Approved 且 stage 匹配 | ✓ | Approved（绿） | 已完成 |
| log 含 Rejected | ✗ | Rejected（红） | 终态 |
| log 含 Update Required | ⚠ | Update Required（橙） | |
| stage === currentStage 且 In Progress | ◷ | Pending（黄） | 当前待审 |
| workflow 中未到达 | ○ | Pending（灰）或无徽章 | 未来节点 |

**异动 workflow 来源：**

```js
import { getWorkflowStages } from './movementApprovalWorkflows.js'
const stages = getWorkflowStages(sourceKey, inferStudentCategory(item))
// 首节点前置 Applicant/Submission（不在 workflow 数组中）
```

**课程 workflow 来源：**

- 新课：`approvalStageOptions` 或从 mock 推导有序 stage 列表
- 变更：复用 `courseChangeApplications` 侧 stage 序列
- Temporary saved / Draft：仅展示 Submitted（若有）或空态

### D4：抽屉布局 CSS

参考 `StudentProfileDetailDrawer`：

```css
.drawer-panel { display: flex; flex-direction: column; height: 100%; width: min(1080px, 92vw); }
.drawer-header, .drawer-footer { flex-shrink: 0; }
.drawer-scroll { flex: 1; overflow-y: auto; }
.timeline-section { padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; }
```

**z-index**：抽屉 `1000`；抽屉内触发的 `MovementApprovalModal` / `ConfirmDialog` ≥ `1100`（与现 ApprovalLogModal 一致）。

### D5：各场景 footer 按钮

| 场景 | footer |
|------|--------|
| 学生端详情 | Close |
| 管理 Query | Close |
| 管理 Maintenance | Close |
| 管理 Approval — Submitted/History | Close；History 且可 Recall 时 + Recall |
| 管理 Approval — Pending | Close + Review（打开 `MovementApprovalModal`） |
| 课程申请 Details | Close |
| 课程审批 Pending | Close + Approve（复用现有审批 Modal） |

列表保留：Edit、Delete、Cancel、Submit、Withdraw 等 — **不进入 footer**。

### D6：MovementApprovalReviewView 处置

- **废弃** Query / Maintenance / Approval 的 `viewMode === 'review'` 整页分支
- 逻辑迁移至 `MovementApplicationDetailDrawer` + footer 审批/recall
- 文件可保留一版 re-export 或删除（tasks 中明确）

### D7：i18n

- 统一按钮：`common.details` / `tr('Details')` / 学生端现有 `*.actions.details`
- 时间线区标题：`common.approvalLog` 或新增 `common.approvalTimeline`
- 状态徽章：`approvalTimeline.status.submitted` / `.pending` / `.approved` 等

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 4 DetailModal + 课程详情拆分量较大 | 先 Query 页试点，再批量迁移 |
| 课程侧无统一 workflow 函数 | `buildApprovalTimelineNodes` 接受显式 stages 参数 |
| mock log stage 名与 workflow 不一致 | normalizeStageName 映射（Submission → Applicant） |
| 抽屉内容过高 | 单 scroll 区域；timeline 默认可折叠（非首版） |

## Migration Plan

1. 新增 `ApprovalTimeline` + `ApplicationDetailDrawer` + timeline builder
2. 新增 `MovementApplicationDetailDrawer`；Query 页接入
3. Approval / Maintenance / 学生 4 View
4. 课程 4 View + `CourseApplicationDetailDrawer`
5. 移除各 View 的 `ApprovalLogModal` 与整页 ReviewView
6. 更新 OpenSpec delta specs；手动回归 11 页

## Open Questions

- 课程 Temporary saved 是否展示完整 pending chain — **首版仅展示已有 log + 当前 stage**
- `ApprovalLogModal` 是否删除 — **保留文件，列表不再引用**
