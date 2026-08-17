# 变更：polish-whitelist-page-ux

## Why

白名单页（原补注册壳）文案大量露出 i18n key：`courseRegistration.whitelist.*` 被旧 BOA「白名单审批」同名块覆盖。列表无本页新增，权限列显示英文 key，与「可手工新增 + 监控写入」双来源口径不符。

## What Changes

- 拆分 i18n：现行突破限制白名单键保留 `whitelist`；旧 BOA 审批链改名为 `whitelistBoa`，并改未挂菜单旧页引用
- 白名单列表：Callout/列头/权限摘要正确中英；增加「来源」列；工具条「新增」
- 新增/编辑抽屉：选学生（仅新增）、勾选权限、填写有效时长/先修截止、备注；写入同一 `supplementListQueue`（`source: manual`）
- 监控加入路径保持不变（`source: registration-monitor`）
- 相关「补注册名单」跳转/推荐文案统一为白名单

## Non-goals

- 不实现 BOA 在线审批链
- 不改学生闸门默认「未邀请是否开门」策略（可另包）
- 不删除旧 WhitelistView 源码（仍不挂菜单）

## Capabilities

### Modified Capabilities

- `course-registration`：白名单页展示与本页新增

## Impact

- `zh.js` / `en.js`
- `SupplementListView.vue`、`SupplementEntryDrawer.vue`
- 可选学生选择器复用
- `WhitelistView.vue` 等旧页 i18n 前缀
