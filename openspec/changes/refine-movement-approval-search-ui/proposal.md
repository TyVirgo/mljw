## Why

`add-movement-approval-app` 在审批页顶部放置了 **Current approver role** 下拉，用于 demo 切换 mock 审批角色。产品图示与最新反馈表明该控件不应出现在页面上——审批视角由登录身份（v1 固定默认角色）决定，而非用户在列表页手动切换。

同时，搜索区当前采用「首行 3 字段 + 更多展开 2 字段」布局，与图示及课程审批等模块的自适应栅格不一致，窄屏下字段换行不自然、操作按钮对齐不稳定。

首版搜索 UI 交付后，产品进一步要求 **Tab 顺序/角标**、**表格列**（去异动原因、加申请日期）、**是否实施仅历史 Tab 显示 Y/N**、**状态列可见性修复** 与 **搜索字段精简**（去掉异动原因）。

## What Changes

### 移除 Role 选择器 UI

- **删除** `MovementApprovalView.vue` 顶部 `role-bar`（标签 + 下拉）
- **删除** 对 `approverRoleOptions` 的页面级 import 与 `v-model="currentRole"` 绑定
- **保留** 内部 `currentRole` 常量（默认 `Pending Review`），供 Tab 分桶、审批、Recall 引擎使用
- **保留** `MovementApprovalReviewView` 的 `currentRole` prop 传递（来自父级常量，非 UI）

### 搜索区自适应布局（§1–§5 已交付，§8 将精简为 4 字段）

- **合并** 搜索字段为单一响应式栅格，取消「更多 / 收起」展开交互
- **对齐** `CourseApprovalView` 模式：左侧字段区 `flex: 1` + `grid/flex-wrap` 自适应；右侧 Search / Reset 固定列
- 移除 Collapse 按钮（全部字段常显）
- §8 增量：由 5 字段减为 **4 字段**（去掉异动原因，见下方「搜索区精简」）

### Tab 顺序与角标（本阶段新增）

- Tab 顺序：**待我审批 → 已提交 → 历史**
- **仅「待我审批」** Tab 显示数量角标；已提交、历史不显示数字

### 表格列调整（本阶段新增）

| 变更 | 说明 |
|------|------|
| 状态列 | 修复 badge 样式（当前白字无背景不可见）；文案与申请页一致（不含 Draft）；`Expired` 等补 i18n |
| 是否实施 | **仅历史 Tab** 显示该列；`Implemented` → **Y**，其余（含 Approved 待实施）→ **N** |
| 去列 | 异动原因 |
| 增列 | **申请日期**（格式与各异动申请列表 `format*ListDate` 一致） |

### 搜索区精简（本阶段新增）

- **移除**「异动原因」搜索项（与表格列移除一致）
- 保留：学年学期、状态、学号、学生姓名（4 字段）

### i18n 清理（可选）

- 移除或保留 `movementApproval.currentRole` key（UI 不再引用即可）

## Capabilities

### Modified Capabilities

- `movement-approval-app`: 列表页布局——无 Role 下拉；搜索区响应式栅格；**Tab/表格列/搜索字段 delta**

## Impact

- **修改** `src/views/studentRecords/MovementApprovalView.vue` — 模板与样式
- **修改** `src/data/movementApprovalQueue.js` — 申请日期格式化、implemented Y/N、搜索过滤去掉 reason
- **修改** 四异动 seed（可选）— 历史 Tab 部分 Approved 记录设 `implemented: 'Implemented'` 以展示 Y
- **可选修改** `src/data/movementApprovalEngine.js` — 导出 `DEFAULT_APPROVER_ROLE` 常量
- **修改** `src/i18n/locales/en.js` / `zh.js` — 新增 `movementApproval.columns.applicationDate`；可选清理 `search.movementReason`
- **§12 修改** `MovementApprovalReviewView.vue`、四 `*DetailModal.vue` — footer 审批 + Modal
- **不变** Tab 分桶语义、审批引擎、列表 `MovementApprovalModal`、store 写回

## Decisions（探索阶段已确认）

| 项 | 决策 |
|----|------|
| Tab 顺序 | 待我审批 → 已提交 → 历史 |
| Tab 角标 | 仅待我审批显示数量 |
| 申请日期格式 | 与各异动申请列表一致（按 sourceKey 调用 `format*ListDate`） |
| 是否实施 | 仅历史 Tab 有列；Y = `Implemented`，其余均为 N |
| 搜索 | 去掉异动原因（4 字段） |

---

## §11 搜索增加专业代码（增量）

产品要求四模块（审批 / 维护 / 查询 / 统计）搜索字段一致：**学年学期旁增加专业代码**；审批在本 change 增量中由 4 字段变为 **5 字段**。

### 审批搜索（本 change）

| 变更 | 说明 |
|------|------|
| 新增 | **专业代码** 文本搜索，紧挨学年学期 |
| 保留 | 无「异动原因」搜索（§8 已删除） |
| 字段 | 学年学期、专业代码、状态、学号、学生姓名 |

### 数据层（本 change 范围）

- `normalizeQueueItem` 增加 `programmeCode`（`resolveStatDimensions`）
- `filterBySearch` 支持 `programmeCode` 模糊匹配

### Decisions（§11 已确认）

| 项 | 决策 |
|----|------|
| 专业代码语义 | 转专业=现专业代码；休学/退学/复学=申请 programme 映射代码 |
| 匹配 | substring 模糊，与其它文本搜索一致 |
| 转专业 | 不含 newProgrammeCode |

## §12 审批详情：footer 审批按钮 + Modal（增量）

产品图示要求：**Pending Tab 查看详情时，不在页面底部内联展示审批表单**；在详情 footer **关闭** 按钮旁增加 **审批**，点击后弹出与列表勾选后 **Review** 相同的 `MovementApprovalModal`。

### 交互（已确认）

```
Pending → View
┌────────────────────────────────────────┐
│ ← 返回    标题（申请详情 / 审批申请）   │
│  DetailModal 只读内容                   │
│  footer:  [审批]  [关闭]               │  ← 定稿位置（非 header）
└────────────────────────────────────────┘
         │ 点击「审批」
         ▼
   MovementApprovalModal（Teleport，与列表 Review 一致）
         │ 确认
         ▼
   返回列表（沿用 @decided → closeReview）
```

| Tab | footer |
|-----|--------|
| Pending（mode=approve） | `[审批]` + `[关闭]` |
| Submitted / History | 仅 `[关闭]`；History 的 Recall 仍保留在 ReviewView 底部（本 § 不改） |

### 实现范围

- **删除** `MovementApprovalReviewView` 底部 `approval-section`（内联 Action/Comments/Submit 及关联 state）
- **四异动 DetailModal**：可选 prop `showApprovalAction`；footer 在关闭前渲染「审批」→ `emit('approve')`
- **ReviewView**：挂载 `MovementApprovalModal`（`target-count=1`）；确认时 `applyMovementDecision` → `emit('decided')`
- **复用** 列表已有 `MovementApprovalModal`，不新建第二套审批 UI

### Decisions（§12 已确认）

| 项 | 决策 |
|----|------|
| 按钮位置 | footer `[审批]` 在 `[关闭]` 左侧 |
| 弹框 | 与列表 `MovementApprovalModal` 完全一致 |
| Section VII | **A**：Modal 不扩展教务字段；与列表批量审批对齐，依赖申请预填 `newProgrammeFirstChoice` 等 |
| Recall | 保持 ReviewView 底部 inline（本 § 不改动） |

### Impact（§12）

- **修改** `MovementApprovalReviewView.vue` — 删内联审批；接 Modal + footer 审批入口
- **修改** 四 `*DetailModal.vue` — `showApprovalAction` + footer 按钮
- **可选** `movementApproval.approve` i18n（或复用 `tr('Review')`）
- **不变** 列表批量 Review、`applyMovementDecision` 引擎语义

## Non-goals

- 实现真实登录用户 → 审批角色映射
- 恢复页内多角色 demo 切换（若需 demo 可改 mock 常量或 dev 配置，不在 UI 暴露）
- ~~修改表格列、Tab 文案或审批业务逻辑~~（本 change §6 已纳入表格/Tab UI delta；不改分桶引擎语义）
