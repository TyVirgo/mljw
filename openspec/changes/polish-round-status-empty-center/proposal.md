## Why

「本轮选课情况」空表「未选择课程」因宽表 `colspan` 相对整表居中，在可见视口内贴左上角，可读性差。

## What Changes

- 空态改为表头下独立空面板，相对可见区域水平垂直居中。
- 优化空态文案样式（主文案 + 次要提示）。
- 有数据时表格布局不变。

## Non-goals

- 不改志愿拖拽、列结构或空态以外的交互。

## Capabilities

### New Capabilities

- `round-status-empty-center`: 本轮选课情况空态居中展示

### Modified Capabilities

- （无）

## Impact

- `StudentRegistrationRoundStatusPanel.vue`、zh/en `roundStatusPanel`
