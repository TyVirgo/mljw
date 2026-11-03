## Why

选课结果第二/三轮课程维「新生/老生容量」展示「已选/总量」信息过载，教务只需看已选人数。另：我的课表无排课实习提示目前为纯灰字，不够像提示条。

## What Changes

- 二/三轮课程维（非第一轮共用表）：新生/老生列只显示已选分子；表头改为「新生容量已选」「老生容量已选」；导出与 tip 文案对齐。
- 我的课表 footer 无排课提示：加浅蓝底、边框与「提示」标识。

## Non-goals

- 不改「有效最大容量（已选/总量）」。
- 不改第一轮课程维志愿/老生容量列。

## Capabilities

### New Capabilities

- `result-r23-enrolled-capacity`: 二/三轮课程维新老生仅已选
- `my-result-untimed-tip-style`: 课表无排课提示样式

### Modified Capabilities

- （无）

## Impact

- `registrationResultByRound.js`、`RegistrationResultView.vue`、导出字段 i18n
- `StudentMyResultView.vue` tip 样式
