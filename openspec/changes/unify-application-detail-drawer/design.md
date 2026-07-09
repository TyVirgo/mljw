## 背景说明

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

目标（对齐后续原型 `refine-movement-admin-detail-export`）：

```
列表（不动）
    │
    └── [详情] ──▶ ApplicationDetailDrawer（右滑）
                      ┌──────────────────────────────┐
                      │ 详情                     [×] │  fixed header
                      ├──────────────────────────────┤
                      │ 申请详情字段区块…             │  scroll
                      │ ──────────────────────────── │
                      │ ┌ Approval Log 表格 ───────┐ │
                      │ │ Description | Action By  │ │
                      │ │ Action By Role | Created │ │
                      │ └──────────────────────────┘ │
                      ├──────────────────────────────┤
                      │ [Export PDF]      [Close]    │  fixed footer（按场景）
                      └──────────────────────────────┘
```

已有可复用：`StudentProfileDetailDrawer`（右滑壳）、四 `*DetailModal`（字段布局）、`approvalLog[]`、`MovementApprovalLogTable`。

## 目标 / 非目标

**目标：**

- 11 个页面合并「详情 + 日志」为单一「详情」按钮
- 右滑抽屉：上详情、下审批日志四列表格、底固定操作
- 审批日志表格列：Description、Action By、Action By Role、Created At
- 列表其他操作按钮位置与行为不变
- 异动审批 Pending tab 的 Review 在抽屉 footer

**非目标：**

- 抽屉内上一条/下一条记录导航
- 改审批引擎、workflow 定义
- 无双按钮页面（如统计页、纯配置页）
- 将 Edit/Delete/Cancel 移入抽屉 footer

## 设计决策

### D1：壳组件分层

```
ApplicationDetailDrawer.vue          ← 通用：overlay、panel、header、scroll-body、footer slot
    ├── MovementApprovalLogTable.vue ← 通用：审批日志四列表格
    └── slot #detail                 ← 领域内容

MovementApplicationDetailDrawer.vue  ← 组装：queueItem → 详情内容 + 审批日志表格
CourseApplicationDetailDrawer.vue    ← 组装：course item → 详情内容 + 审批日志表格
```

**理由**：异动与课程详情结构差异大，共用壳 + 审批日志表格，内容分领域 wrapper。

> **演进说明**：首版曾实现 `ApprovalTimeline.vue` 竖向时间线；后续由 `refine-movement-admin-detail-export` 统一为详情在上、审批日志表格在下。

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

### D3：审批日志表格展示

```js
// movementApprovalLogDisplay.js — 将 approvalLog[] 映射为表格行
formatApprovalLogRows({
  approvalLog,      // { stage, actor, action, dateTime, comment, role }[]
})
```

**列定义：**

| 列 | 说明 |
|------|------|
| Description | Submitted 显示 Application Submitted；其余显示 action/stage 文案 |
| Action By | 处理人 |
| Action By Role | 处理人角色 |
| Created At | `YYYY-MM-DD HH:mm:ss` |

**异动日志来源：** `item.approvalLog[]` 按时间顺序渲染。

**课程日志来源：** 课程/变更申请 mock 中 `approvalLog` 或等价字段。

### D4：抽屉布局 CSS

参考 `StudentProfileDetailDrawer`：

```css
.drawer-panel { display: flex; flex-direction: column; height: 100%; width: min(1080px, 92vw); }
.drawer-header, .drawer-footer { flex-shrink: 0; }
.drawer-scroll { flex: 1; overflow-y: auto; }
.approval-log-section { padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
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
- 审批日志区标题：`common.approvalLog`

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 4 DetailModal + 课程详情拆分量较大 | 先 Query 页试点，再批量迁移 |
| 课程侧日志字段不统一 | `formatApprovalLogRows` 接受显式字段映射 |
| mock log 字段缺失 | 空单元格或占位符 |
| 抽屉内容过高 | 单 scroll 区域；详情与日志同区滚动 |

## 迁移说明

1. 新增 `ApplicationDetailDrawer` + `MovementApprovalLogTable` + 日志展示辅助
2. 新增 `MovementApplicationDetailDrawer`；Query 页接入
3. Approval / Maintenance / 学生 4 View
4. 课程 4 View + `CourseApplicationDetailDrawer`
5. 移除各 View 的 `ApprovalLogModal` 与整页 ReviewView
6. 由 `refine-movement-admin-detail-export` 将时间线演进为审批日志表格布局
7. 更新 OpenSpec delta specs；手动回归 11 页

## 待决问题

- 课程 Temporary saved 是否展示完整 pending chain — **首版仅展示已有 log + 当前 stage**
- `ApprovalLogModal` 是否删除 — **保留文件，列表不再引用**
