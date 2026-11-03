## Why

白名单多项权限被嵌套在「允许加退课/重修申请」二级下，且左右列行高错位；产品要求点名权限均为一级，两列上下左右对齐。

## What Changes

- 以下权限升为一级（不挂在加退课父项二级）：允许加退课（含时长）、本学期必修换组、豁免先修、突破学分、退课低于 12、未来学期必修、未来学期选修
- 「可加课 / 可退课 / 可重修」仍为「允许加退课」下唯一二级
- 左右列一级项网格同行对齐；换组不再依赖「可加课」才能勾选
- 同步操作说明文案

## Non-goals

- 不改 permissions 数据模型与业务判定（仅 UI 层级与门禁展示）
- 不恢复重修换组

## Capabilities

### New Capabilities

- `whitelist-flat-permission-grid`: 一级权限两列对齐布局

### Modified Capabilities

- （无）

## Impact

- `SupplementEntryDrawer.vue`
- `zh.js` / `en.js`（formHint）
