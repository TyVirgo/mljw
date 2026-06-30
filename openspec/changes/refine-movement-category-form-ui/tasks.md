## 1. i18n

- [x] 1.1 `zh.js`：`movementCategory.fields.category` 改为「学籍类型」
- [x] 1.2 `en.js`：`movementCategory.fields.category` 改为 `Track Category`
- [x] 1.3 确认 hint 文案 key 不变（`modifyStudentStatusHint` 等）

## 2. 数据层（movementCategories.js）

- [x] 2.1 `validateMovementCategoryForm`：`studentStatus` 仅在 `modifyStudentStatus === true` 时 required
- [x] 2.2 `validateMovementCategoryForm`：`category` 仅在 `modifyStudentType === true` 时 required
- [x] 2.3 错误消息英文 key 可改为 `Track category is required.` / `Track category is invalid.`（可选，与标签一致）

## 3. 编辑弹框（MovementCategoryFormModal.vue）

- [x] 3.1 三开关：移除 `<p class="field-hint">`；标签旁加 `?` + tooltip（hover / focus-within）
- [x] 3.2 布局：`字段名 ? : [YnSwitch]`，开关仍在 `field-control`
- [x] 3.3 学籍状态下拉：`v-if="form.modifyStudentStatus"`，移除 `:disabled="form.modifyStudentStatus"`
- [x] 3.4 学籍类型下拉：`v-if="form.modifyStudentType"`，移除 `:disabled="form.modifyStudentType"`
- [x] 3.5 Row3 容器：`v-if` 至少一开关 ON；单列时 `form-field-full`（`grid-column: 1 / -1`）
- [x] 3.6 添加 tooltip 样式（参考 `ProgrammeVersionCreateModal` 或内联 scoped CSS）
- [x] 3.7 标签改用 `t('movementCategory.fields.category')`（学籍类型）

## 4. 列表页（MovementCategoryView.vue）

- [x] 4.1 确认表头使用 `movementCategory.fields.category`（随 i18n 自动变为「学籍类型」）
- [x] 4.2 确认列表仍展示 `studentStatus` / `category` 值，无逻辑变更

## 5. 验证

- [x] 5.1 PT001 编辑：双开关 OFF → Row3 隐藏；保存成功；列表仍显示在读 / 转专业
- [x] 5.2 DEF001 编辑：`modifyStudentStatus` ON → 学籍状态下拉可见可改；OFF 保存不要求必选
- [x] 5.3 仅一开关 ON → Row3 单列满宽；双 ON → 双列
- [x] 5.4 三处 `?` 气泡 hover 显示 hint，开关下无灰色常驻文字
- [ ] 5.5 `npm run build` 通过（本机 Node v16 触发 Vite crypto 错误，与本次改动无关；需在 Node 18+ 环境复验）
