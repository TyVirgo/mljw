## Why

缴费名单「导出」为灰边 default，与其它选课过程页蓝边 outline 不一致；加退课审批「提交时间」有/无秒混用；白名单「添加白名单时间」为英文日格式，与审批时间不一致。

## What Changes

- 缴费名单导出按钮改为 `btn-outline`，保持工具栏左对齐。
- 审批列表/导出「提交时间」统一 `YYYY-MM-DD HH:mm:ss`（缺秒补 `:00`）；demo 种子同步。
- 白名单 `formatWhitelistAddedAt` 与种子改为同一秒级格式。

## Non-goals

- 不改导出业务字段与筛选逻辑。
- 不改邀请门截止时间计算（仍用 invite stamp）。

## Capabilities

### New Capabilities

- `align-cr-datetime-export`: 导出按钮样式与时间到秒对齐

### Modified Capabilities

- （无）

## Impact

- `FeeRosterView.vue`
- `AddDropApprovalView.vue`、`studentDemoSeed.js`、`formatSupplementExportRow`（若含 addedAt）
- `supplementListQueue.js`（`formatWhitelistAddedAt` + demo addedAt）
