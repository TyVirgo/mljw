# 学籍管理-异动类别配置 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-movement-category-config

```
## 1. 数据层

- [x] 1.1 创建 `src/data/movementCategories.js`：`movementCategories` ref，**6 条 mock**（2 组 × Local/Chinese/International）
- [x] 1.2 实现 `studentStatusCategoryMap` 与 `getCategoriesForStatus(status)`（图示3 全表）
- [x] 1.3 实现 `createMovementCategory(form)`：**单行 Create**
- [x] 1.4 实现 `updateMovementCategory(id, patch)`、`deleteMovementCategories(ids)`
- [x] 1.5 实现原因 helper：`addReason`、`updateReason`、`deleteReasons`
- [x] 1.6 实现 `validateMovementCategoryForm(data, mode)`：必填、categoryCode+studentType 唯一

## 2. i18n

- [x] 2.1 在 `en.js`、`zh.js` 新增 `movementCategory.*`
- [x] 2.2 Student Type 数据用 Chinese；中文界面显示「中国」
- [x] 2.3 在 `zh-flat.js` 同步校验 flat 映射

## 3. 表单 Modal（图示2）

- [x] 3.1 创建 `MovementCategoryFormModal.vue`：双列、六项字段、Create/Edit
- [x] 3.2 Create 模式：Student Type 可选（单行 Create）
- [x] 3.3 Edit 模式：Student Type 只读；Status 变更联动 Category
- [x] 3.4 Footer：Cancel + Save

## 4. 原因 Modal（图示5）

- [x] 4.1 创建 `MovementCategoryReasonModal.vue`
- [x] 4.2 创建 `MovementCategoryReasonEditModal.vue`（Cancel + Save）
- [x] 4.3 行内 Edit / Create 打开 ReasonEditModal

## 5. 列表页

- [x] 5.1 创建 `MovementCategoryView.vue`：搜索区（list-page-search.css）、Create/Delete、表格、分页
- [x] 5.2 集成 FormModal、ReasonModal、ConfirmDialog
- [x] 5.3 Actions：Edit | 设置原因

## 6. 路由与菜单

- [x] 6.1 `studentRecordsDevelopedPages` 加入 `sr-movement-category`
- [x] 6.2 `App.vue` 挂载 `MovementCategoryView`

## 7. 验证（首版）

- [x] 7.1 冒烟：6 行种子 → Create 单行 → Edit → Delete → 设置原因增删改
- [x] 7.2 确认异动申请模块未引用本 store（首版）
- [x] 7.3 `npm run build` 通过

---

##
```

### refine-movement-category-form-ui

```
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
- [ ]
```

### refine-movement-reason-allow-student-switch

```
## 1. 数据与组件

- [x] 1.1 `movementCategories.js`：`reasonAllowStudentApply` / `categoriesFromAllowStudentApply` / 默认关
- [x] 1.2 `YnSwitch.vue` 支持自定义 on/off 文案

## 2. 界面
- [x] 2.1 `MovementCategoryReasonModal.vue` 列表列开关可点击
- [x] 2.2 `MovementCategoryReasonEditModal.vue` 开关替代多选
- [x] 2.3 i18n

## 3. 验证

- [x] 3.1 `npm run build`
```

### refine-movement-reason-personnel-multiselect

```
# 任务
- [x] 1. 数据层多选数组与旧值迁移
- [x] 2. 新增/编辑多选下拉，默认老师+学生
- [x] 3. 主列表展示
- [x] 4. `npm run build` 验证
- [x] 5. 修复多选下拉被 modal 裁切；选项顺序与列表/编辑同步
```

### remove-exclude-graded-from-preset-option

```
## 1. UI 与数据字段移除

- [x] 1.1 从 `MovementCategoryFormModal.vue` 移除第三行 `excludeGradedFromPreset` checkbox，并清理表单初始化映射
- [x] 1.2 从 `movementCategories.js` 的 normalize、种子行、`createEmptyMovementCategoryForm` 中删除该字段
- [x] 1.3 从 `MovementCategoryView.vue` 保存映射中删除该字段

## 2. 文案清理

- [x] 2.1 删除 `zh.js` / `en.js` 中 `movementCategory.fields.excludeGradedFromPreset` 文案键

## 3. 冒烟验证

- [x] 3.1 打开 PT001/DEF001 编辑：处理选课仅两项；布局仍为首项同行+第二项缩进；保存后再打开配置正确
```
