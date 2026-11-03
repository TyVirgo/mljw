## Why

在线选课列表「先修课」列未说明口径：先修来自培养方案、因专业而异。需在表头旁补充 tooltip，避免学生误以为全校统一先修。

## What Changes

- 新增 i18n：`courseRegistration.courses.prerequisitesTip`
- 在线选课主列表与待开放预览表头「先修课」旁增加与「校选课类型」同款 ⓘ tip

## Non-goals

- 不改按专业动态过滤先修的数据逻辑
- 不改搜索区 label、详情抽屉字段

## Capabilities

### New Capabilities

- `prerequisites-column-tip`：在线选课先修课列表头说明

### Modified Capabilities

- （无）

## Impact

- `src/i18n/locales/zh.js` / `en.js`
- `StudentRegisterView.vue`、`StudentPendingRoundPreviewPanel.vue`
