## 1. UI 与数据字段移除

- [x] 1.1 从 `MovementCategoryFormModal.vue` 移除第三行 `excludeGradedFromPreset` checkbox，并清理表单初始化映射
- [x] 1.2 从 `movementCategories.js` 的 normalize、种子行、`createEmptyMovementCategoryForm` 中删除该字段
- [x] 1.3 从 `MovementCategoryView.vue` 保存映射中删除该字段

## 2. 文案清理

- [x] 2.1 删除 `zh.js` / `en.js` 中 `movementCategory.fields.excludeGradedFromPreset` 文案键

## 3. 冒烟验证

- [x] 3.1 打开 PT001/DEF001 编辑：处理选课仅两项；布局仍为首项同行+第二项缩进；保存后再打开配置正确
