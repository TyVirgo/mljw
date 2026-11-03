## Why

审批弹窗行键仅用 `课号::分组`，退/加同课同组共用 radio 与决策 map，表现为无法同时批量通过。操作列偏窄，「添加评价」易被右侧裁切。

## What Changes

- 审批行 `itemKey` 纳入 `action`（及必要时 idx），退/加/重修同行独立决策与评价
- 加宽操作列，保证单选 +「添加评价」完整可见

## Non-goals

- 不改全局 `addDropLineKey`（表单去重仍可用无 action 键）
- 不改行决策业务规则（通过/不通过/驳回混选等）

## Capabilities

### New Capabilities

- `adddrop-approval-line-key-op-width`: 审批行键含 action + 操作列加宽

## Impact

- `AddDropApprovalModal.vue`
