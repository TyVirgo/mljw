## Why

异动类别 Edit 弹框「处理选课」第三项「已获得成绩课程不预置到新专业批次名单」经产品反馈不再需要展示与配置；应从前端表单与 mock 数据中移除，避免评审误解。

## What Changes

- 从异动类别编辑 / 新建弹框「处理选课」区移除第三行 checkbox（`excludeGradedFromPreset`）
- 保留前两项：删除原课程名单、预置新专业批次名单（布局与独立勾选规则不变）
- 从 mock 种子、normalize、空表单、保存 payload、i18n 中删除该字段
- **BREAKING**（仅 mock/原型）：已持久化在 localStorage 中的 `excludeGradedFromPreset` 不再读写；加载时可忽略

## Non-goals

- 不接真实选课 API，不改变选课模块业务逻辑
- 不改动四类异动（PT001 / DEF001 / WDR001 / RES001）对「处理选课」区的可见范围
- 不归档或改写已完成的 `add-movement-category-config` change 历史文档

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `movement-category-config`：处理选课由三项改为两项；移除「排除已获成绩课程预置」相关需求与场景

## Impact

- UI：`MovementCategoryFormModal.vue`
- 数据：`src/data/movementCategories.js`、`MovementCategoryView.vue` 保存映射
- 文案：`src/i18n/locales/zh.js`、`en.js` 的 `excludeGradedFromPreset`
- 规格：delta → `specs/movement-category-config/spec.md`
