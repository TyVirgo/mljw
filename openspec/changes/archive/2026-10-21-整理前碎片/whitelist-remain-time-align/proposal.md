## Why

白名单「生效剩余时间」现为 `47h 22m`、无色阶，与审批「缴费剩余时间」（`X天X小时X分钟` + 橙/红）不一致，教务对照阅读成本高。

## What Changes

- 倒计时格式对齐缴费：`{d}天{h}小时{m}分钟`。
- 保留「未发送」「已逾期」文案。
- 列表单元格色阶对齐：临近 warn、紧急 urgent、逾期 overdue。
- 列表可随时间刷新（轻量 tick）。

## Non-goals

- 不改邀请/再次开放业务规则与截止计算。
- 不改列名「生效剩余时间」。

## Capabilities

### New Capabilities

- `whitelist-remain-time-display`: 白名单剩余时间展示对齐缴费剩余

### Modified Capabilities

- （无）

## Impact

- `formatSupplementInviteCountdown` / `SupplementListView.vue`
- 复用 `formatRemainingDuration` 与色阶阈值
