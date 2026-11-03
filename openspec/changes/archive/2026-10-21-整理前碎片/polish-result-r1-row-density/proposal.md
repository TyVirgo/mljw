## Why

选课结果「课程维度 · 第一轮」同课多分组 rowspan 表沿用全局 `10px 12px` 单元格内边距，分组行叠加后视觉间隙偏大，需对齐更紧凑的列表密度。

## What Changes

- 仅收紧 `.round1-merge-table` 的 th/td padding（约 `6px 10px`）
- 不改第二/三轮、学生维度与全局 `.data-table`

## Non-goals

- 不改列结构、rowspan 逻辑或操作列是否合并
- 不改全局列表样式

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `course-reg-result`：课程维度第一轮表行密度

## Impact

- `RegistrationResultView.vue` scoped CSS
