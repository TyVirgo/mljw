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

## 8. 实施行为开关扩展（增量）

- [x] 8.1 扩展 `movementCategories.js`：`modifyStudentStatus`、`modifyStudentType`、`autoImplement`（默认 false）；`normalizeRow` / `createEmptyMovementCategoryForm` 同步
- [x] 8.2 新增 WDR001、RES001 各 ×3 共 **6 条** mock；更新 PT/DEF 演示用开关值；总计 **12 条**
- [x] 8.3 实现 `resolveMovementCategoryConfig(sourceKey, studentCategory)` + sourceKey→categoryCode 映射
- [x] 8.4 `MovementCategoryFormModal.vue`：三个开关 UI（与下拉字段文案区分）；Create/Edit 读写三字段
- [x] 8.5 i18n：`movementCategory.fields.modifyStudentStatus`、`modifyStudentType`、`autoImplement`

## 9. 审批 / 维护流水线

- [x] 9.1 `movementApprovalEngine.js`：最终 Approved 时 lookup 配置，按 `autoImplement` 设 `implemented`
- [x] 9.2 `movementMaintenanceFields.js`：实施时 `applyImplementationEffect`；读 modify 开关 mock 回写 `students.js`
- [x] 9.3 确认维护列表仍展示 auto-Implemented 行；`canImplement` 仅 Pending

## 10. 验证（增量）

- [x] 10.1 冒烟：RES001 Local 审批通过 → 维护列表「已实施」且不可再点实施
- [x] 10.2 冒烟：WDR001 审批通过 → Pending → 维护手动实施 → Implemented
- [x] 10.3 冒烟：类别弹框三开关 Create/Edit 持久化；12 行种子可见
- [x] 10.4 `npm run build` 通过

## 11. 开关说明文案（增量）

- [x] 11.1 更新 `autoImplementHint` 为「开启后，该异动审批通过后将自动标记为已实施」
- [x] 11.2 新增 `modifyStudentStatusHint`、`modifyStudentTypeHint`（说明是否修改对应档案字段）
- [x] 11.3 弹框三个开关均展示 hint；i18n en/zh 同步
