## Why

选课结果第二/三轮容量列展示「已选」，管理端更需要看剩余「可选」名额；文案与数字口径需翻转，且不得影响第一轮。

## What Changes

- R2/R3：有效最大容量改为（可选/总量）；新生/老生列改为「…可选」，数值 = max(0, 容量 − 已选)
- R2/R3 搜索区间同步按可选分子筛选，标签改为「…可选」
- 第一轮表头/数据/ tip 不改；ME 老生可点弹窗保留
- 新增 R2/R3 专用 i18n 键，避免与 R1「已选」文案共用

## Non-goals

- 不改特殊新加列
- 不改名单抽屉与删除逻辑
- 不改 R1 有效最大/老生展示口径

## Capabilities

### New Capabilities

- `result-r23-capacity-available`: 第二/三轮容量列与搜索改为可选口径

### Modified Capabilities

- （无）

## Impact

- `registrationResultByRound.js`
- `RegistrationResultView.vue`
- `zh.js` / `en.js`
- 导出若复用 R2/R3 列文案则随新键
