## Why

`add-movement-approval-app` 在审批页顶部放置了 **Current approver role** 下拉，用于 demo 切换 mock 审批角色。产品图示与最新反馈表明该控件不应出现在页面上——审批视角由登录身份（v1 固定默认角色）决定，而非用户在列表页手动切换。

同时，搜索区当前采用「首行 3 字段 + 更多展开 2 字段」布局，与图示及课程审批等模块的自适应栅格不一致，窄屏下字段换行不自然、操作按钮对齐不稳定。

## What Changes

### 移除 Role 选择器 UI

- **删除** `MovementApprovalView.vue` 顶部 `role-bar`（标签 + 下拉）
- **删除** 对 `approverRoleOptions` 的页面级 import 与 `v-model="currentRole"` 绑定
- **保留** 内部 `currentRole` 常量（默认 `Pending Review`），供 Tab 分桶、审批、Recall 引擎使用
- **保留** `MovementApprovalReviewView` 的 `currentRole` prop 传递（来自父级常量，非 UI）

### 搜索区自适应布局

- **合并** 5 个搜索字段为单一响应式栅格，取消「更多 / 收起」展开交互
- 字段：Academic Session、Movement Reason、Status、Student ID、Student Name
- **对齐** `CourseApprovalView` 模式：左侧字段区 `flex: 1` + `grid/flex-wrap` 自适应；右侧 Search / Reset 固定列
- 移除 Collapse 按钮（全部字段常显）

### i18n 清理（可选）

- 移除或保留 `movementApproval.currentRole` key（UI 不再引用即可）

## Capabilities

### Modified Capabilities

- `movement-approval-app`: 列表页布局——无 Role 下拉；搜索区响应式栅格

## Impact

- **修改** `src/views/studentRecords/MovementApprovalView.vue` — 模板与样式
- **可选修改** `src/data/movementApprovalEngine.js` — 导出 `DEFAULT_APPROVER_ROLE` 常量
- **可选清理** `src/i18n/locales/en.js` / `zh.js` — 移除未用 key
- **不变** Tab 分桶语义、审批引擎、Review/Modal、store 写回

## Non-goals

- 实现真实登录用户 → 审批角色映射
- 恢复页内多角色 demo 切换（若需 demo 可改 mock 常量或 dev 配置，不在 UI 暴露）
- 修改表格列、Tab 文案或审批业务逻辑
