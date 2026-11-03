## Why

选课结果里点击「老生容量」打开的仍是设置侧「年级占比」只读表（占比%/配置名额），无法回答各层次已分配多少、还能选多少；结果页需要使用向口径。

## What Changes

- ME 批课程维点击老生容量：弹窗改为「老生名额使用」——层次 | 配置名额 | 已分配 | 剩余可选
- 按本轮占用名额名单 + meQuota 层次归集已分配；剩余 = max(0, 配置 − 已分配)
- 弹窗样式结果向（去掉占比输入框观感）；更新 tip 文案
- Demo：名单入学学期多样化，保证各层次常见非零已分配

## Non-goals

- 不改设置侧批次/课级年级占比编辑
- 不写回 meQuota 配置
- 非 ME 批仍不可点

## Capabilities

### New Capabilities

- `result-senior-quota-usage`: 结果页老生名额使用弹窗（已分配/剩余可选）

### Modified Capabilities

- （无）

## Impact

- `MeSeniorQuotaReadonlyModal.vue`（或等价改造）
- `registrationResultByRound.js`（usage 聚合 + demo intake）
- `RegistrationResultView.vue`（传入 roundKey）
- `zh.js` / `en.js`
