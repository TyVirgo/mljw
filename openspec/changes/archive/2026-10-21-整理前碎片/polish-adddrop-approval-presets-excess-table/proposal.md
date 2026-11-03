## Why

加退课审批弹窗「常用意见」向上展开时顶部文案被裁切；列表「超出学分（分）」表头冗余且空值为「—」不符合预期；审批历史表强制 `min-width: 1400px` 导致常见宽度下出现多余横滑。

## What Changes

- 审批弹窗常用意见预设列表顶层完整可见（不被 modal 滚动容器裁切）
- 列表字段文案「超出学分（分）」改为「超出学分」；空/无数据时显示 `0`，不再显示「—」
- 审批历史（及同表）列宽收紧，尽量减少或消除横向滚动条

## Non-goals

- 不改常用意见文案内容本身
- 不改超出学分计算逻辑，仅改展示
- 不重构 sticky 列体系；操作列按钮集合不变

## Capabilities

### New Capabilities

- `adddrop-approval-presets-excess-table`: 常用意见完整展示 + 超出学分列展示 + 审批表列宽自适应

### Modified Capabilities

- （无）

## Impact

- `AddDropApprovalModal.vue`（常用意见弹层）
- `AddDropApprovalView.vue` / `StudentAddDropView.vue`（`listExcessCredits`）
- `zh.js` / `en.js`（`fieldExcessCredits`）
- 审批表相关 scoped CSS（`min-width` / 列 padding）
