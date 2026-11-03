## Why

白名单「本学期必修课允许换组」嵌在左列「可加课」下，左列层级过深、右列权限区更适合并列配置项；需在不改变业务门禁的前提下调整布局。

## What Changes

- 将「本学期必修课允许换组」勾选及课组选择行从左列 `permission-nested` 移至右列 `permission-side`
- 仍要求已勾「可加课」（及父项）才可编辑；数据字段不变
- 同步操作说明文案（不再写「可加课下」）

## Non-goals

- 不改 `allowCoreSectionSwitchAdd` / section refs 存储与加课换组锁逻辑
- 不恢复重修换组配置

## Capabilities

### New Capabilities

- `whitelist-core-switch-side-column`: 换组权限展示在右列且仍门禁于可加课

### Modified Capabilities

- （无）

## Impact

- `SupplementEntryDrawer.vue`
- `zh.js` / `en.js`（whitelist 说明）
