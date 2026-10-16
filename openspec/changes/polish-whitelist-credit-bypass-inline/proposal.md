## Why

白名单「允许突破本学期学分要求」的「可超 N 分」目前勾选后另起一行，且未勾选时隐藏，与批次「可退自选课程，每轮不高于 [N] 次」句中嵌数字的交互不一致；顶栏 tip 整段灰字分层不清。

## What Changes

- 「可超 N 分」始终展示，与权限文案同一行，逗号隔开；未勾选时数字框 disabled。
- 顶栏 formHint 按权限语义拆成带序号的说明条目，内容分层更清晰。
- 不改变字段语义、校验范围（勾选时 1–3）与保存逻辑。

## Non-goals

- 不把白名单弹层改成批次那种完整 `step-badge` 大分区骨架。
- 不调整可超学分上下限或默认值。
- 不改其它权限项的父子缩进布局。

## Capabilities

### New Capabilities

- `whitelist-credit-bypass-inline`: 学分例外同行展示与 tip 序号分层

### Modified Capabilities

- （无）

## Impact

- `SupplementEntryDrawer.vue`（credit-bypass 行布局与样式）
- `src/i18n/locales/zh.js` / `en.js`（formHint 与同行文案）
