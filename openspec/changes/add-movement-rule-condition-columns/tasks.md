## 1. 数据模型

- [x] 1.1 在 `movementRules.js` 中为每条规则定义 `condition` 默认值（学期类型、学生类别、异动类别、申请时间）
- [x] 1.2 更新 `normalizeRule()`，对缺少 `condition` 的旧数据使用 fallback 补齐
- [x] 1.3 确保 `updateMovementRuleValue()` 与 `updateMovementRuleEnabled()` 不破坏 `condition` 字段

## 2. UI 展示

- [x] 2.1 在 `MovementRuleSettingsView.vue` 表格中新增 4 列，位于「规则名称」与「规则值」之间
- [x] 2.2 实现 4 个只读字段的渲染逻辑，不适用时显示 `-`
- [x] 2.3 调整列宽与样式，保证新增字段在表格中不溢出

## 3. 国际化

- [x] 3.1 在 `zh.js` 中新增列头与枚举值 i18n
- [x] 3.2 在 `en.js` 中新增列头与枚举值 i18n

## 4. 验证

- [ ] 4.1 `npm run build` 通过
- [ ] 4.2 页面打开后 4 个字段按预期展示，缺省值显示 `-`
