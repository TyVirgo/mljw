## Why

选课时间配置列表中第一/二/三轮时间被 CSS 截断为省略号，管理员无法直接看到完整起止时间。

## What Changes

- 三轮时间列完整展示新生/老生区间（仍可用去秒紧凑格式）
- 去掉列 `max-width` 与 ellipsis；横向滚动承载加宽

## Non-goals

- 不改时间数据格式校验与编辑抽屉
- 不强行改加退选等其它列的截断策略

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `add-session-registration-schedule`：列表三轮时间完整可见

## Impact

- `RegistrationScheduleView.vue`
- `AudienceRoundDualCell.vue`（去掉 compact 行级 ellipsis）
