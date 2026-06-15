## Why

`refine-movement-approval-search-ui` 为审批页搜索区引入了 scoped 样式：`.search-item { flex-direction: column }` 与 `grid` 栅格。这与项目统一的 `list-page-search.css`（标签与输入框 **同一行** 左对齐）不一致，导致图示中「Academic Session + 输入框」等字段标签在上、控件在下换行显示。

用户反馈：**搜索标签与搜索框应保持同一行，不要换行**。

## What Changes

### 搜索项改为 inline 布局（标签 + 控件同行）

- **移除** `MovementApprovalView.vue` 中与全局搜索样式冲突的 scoped 规则（`.search-item` 纵向堆叠、grid 栅格、`align-items: flex-end` 等）
- **复用** 全局 `src/styles/list-page-search.css`（已通过 `style.css` 引入），与 `CourseApprovalView`、休学/退学等列表页一致：
  - `.search-item`：`display: flex; align-items: center; gap: 8px`
  - `label`：`white-space: nowrap`
  - 输入/下拉：固定宽度约 `180px`

### 搜索区整体一行流式排列

- `.search-fields` 使用 `flex-wrap: wrap`（全局默认），多字段可在同一视觉行内流式排列；每个 **字段内部** 标签与控件不换行
- `.search-row` 与 `.search-actions` 保持同一行：左侧条件区 + 右侧 Search / Reset

### 可选标签文案

- 标签可统一加冒号后缀（如 `Status:`），与课程审批 `Course Code:` 风格一致（实现时按现有 i18n key 决定是否追加 `:`）

## Capabilities

### Modified Capabilities

- `movement-approval-app`: 搜索区字段为 inline label+control 布局，对齐列表页统一规范

## Impact

- **修改** `src/views/studentRecords/MovementApprovalView.vue` — 删除/精简 scoped 搜索 CSS
- **不变** 搜索字段集合、Tab、表格、审批逻辑

## Non-goals

- 新增/删除搜索字段
- 修改 Tab 或工具栏
- 变更 `list-page-search.css` 全局规范（除非发现宽度需微调且影响所有页面）
