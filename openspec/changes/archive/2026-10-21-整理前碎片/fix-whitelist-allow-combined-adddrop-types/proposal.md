## Why

三是否合并提交会产生 `AddRetake` / `AddDropRetake`；白名单 `actionsFromSupplementEntry` 未展开这两种类型，导致窗外/新生白名单路径误报「不允许该申请类型」。

## What Changes

- 白名单在具备对应原子权限时，允许列表包含组合类型：
  - `canAdd` + `canRetake` → `AddRetake`
  - `canAdd` + `canDrop` + `canRetake` → `AddDropRetake`
- 不新增独立白名单权限键；合并提交视为合法组合。

## Non-goals

- 不改窗内全开逻辑。
- 不改邀请时效 / supplement 门校验。

## Capabilities

### New Capabilities

- `whitelist-combined-adddrop-types`: 白名单允许三是否组合申请类型

### Modified Capabilities

- （无）

## Impact

- `addDropApprovalQueue.js`（`actionsFromSupplementEntry`）
