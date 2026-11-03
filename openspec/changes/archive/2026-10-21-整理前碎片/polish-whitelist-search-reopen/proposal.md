## Why

白名单页顶栏说明偏技术、搜索仅专业+学生且无收放，空白多；「再次开放」与审批历史「逾期延期后再提醒」的对应关系不够清晰。

## What Changes

- 顶栏提示收成一段：作用（例外权限）+ 发送后计时 + 逾期需再次开放。
- 搜索对齐主表：专业、入学批次、学号、姓名常驻；权限、生效状态进第二行可收放；收紧布局。
- 保持单按钮「再次开放」= 延期开放窗 + 发送通知；文案点明延期语义（不对齐审批页跨模块入口）。

## Non-goals

- 不拆成「延期」「发送」两步。
- 不在加退课审批历史页增加白名单延期入口。
- 不改邀请时长计算规则本身。

## Capabilities

### New Capabilities

- `whitelist-search-reopen-ux`: 白名单搜索收放、提示与再次开放文案

### Modified Capabilities

- （无）

## Impact

- `SupplementListView.vue`、`supplementListQueue.js`（filter）
- i18n zh/en
