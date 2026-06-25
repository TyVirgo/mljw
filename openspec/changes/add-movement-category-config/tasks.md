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

## 12. 表单 IA 重构（图示1/2）

- [x] 12.1 `MovementCategoryFormModal.vue`：删除底部 `switch-section`；Row2 学籍状态/类别嵌入开关（图示2）；Row3 左 autoImplement（左标题右开关+hint 下行）、右允许学生申请
- [x] 12.2 新增 `.field-header` / `.field-hint` 样式；复用 `YnSwitch`
- [x] 12.3 删除表单内学生类型字段及相关 script

## 13. 移除 Student Type 维度

- [x] 13.1 `movementCategories.js`：`normalizeRow` / `createEmptyMovementCategoryForm` 去 `studentType`；导出 `trackCategoryOptions`
- [x] 13.2 类别下拉全量选项；删除 `onStudentStatusChange`、`:disabled`、status 联动校验
- [x] 13.3 唯一性改为 `categoryCode`；删除 `isDuplicateCodeAndType`
- [x] 13.4 Mock 合并为 **4 行**；`resolveMovementCategoryConfig` 仅按 categoryCode
- [x] 13.5 `MovementCategoryView.vue` 删 Student Type 列；`MovementCategoryReasonModal.vue` 副标题去 type
- [x] 13.6 `students.js`：`modifyStudentType` 回写使用 `categoryConfig.category`（如 `enrollment.trackCategory`）

## 14. i18n 与验证

- [x] 14.1 清理 `movementCategory.fields.studentType` 表单/列表引用（保留其它模块 studentType 不受影响）
- [x] 14.2 冒烟：Create/Edit 新布局；4 行 seed；RES001 自动实施仍生效
- [x] 14.3 冒烟：类别与学籍状态可独立选择；无 Student Type 列
- [x] 14.4 `npm run build` 通过

## 15. 表单标签列对齐

- [x] 15.1 `MovementCategoryFormModal.vue`：学籍状态/类别改用 `field-label` 左列 + select 同行；删除 `field-label--spacer` / `inline-label`
- [x] 15.2 修改开关移至 select 下方 `field-switch-row`（右对齐）；hint 在最下
- [x] 15.3 是否自动实施：`field-label` 与类别编码同列；`switch-value-row` 左对齐 YnSwitch + hint
- [x] 15.4 冒烟：Row1–Row3 标签列视觉对齐；`npm run build` 通过

## 16. modify 开关独立行

- [x] 16.1 `MovementCategoryFormModal.vue`：学籍状态/类别 select 列移除内嵌 switch；各拆独立 `form-field` 行
- [x] 16.2 Row3：`修改学籍状态` / `修改学籍类型` 使用 `field-label` + `switch-value-row` 左对齐 + hint
- [x] 16.3 删除 `field-switch-row`；Row4 autoImplement / allowStudentApply 行序不变
- [x] 16.4 冒烟：图示1 标签列与开关对齐；`npm run build` 通过

## 17. 原因数据源同步

- [x] 17.1 `movementCategories.js`：DEF/WDR/PT seed reasons；`getReasonOptionsBySourceKey`、`resolveReasonLabel`、`resolveReasonIdByName`
- [x] 17.2 `deferments.js` / `withdrawals.js` / `programmeTransfers.js`：申请模型加 `reasonId`；normalize 映射存量 mainReason/transferReason；校验 reasonId 必填且有效
- [x] 17.3 `DefermentFormModal` / `WithdrawalFormModal` / `ProgrammeTransferFormModal`：原因 select 来自配置；PT 由 textarea 改 select
- [x] 17.4 各 DetailModal：原因展示走 `resolveReasonLabel`
- [x] 17.5 `movementApprovalQueue.extractMovementReason`：DEF/WDR/PT 统一 resolveReasonLabel；RES 不变
- [x] 17.6 冒烟：设置原因 CRUD 后申请表单选项同步；审批/维护/查询 movementReason 一致；空 reasons 时提交拦截
- [x] 17.7 `npm run build` 通过

## 18. 列表表头去掉排序箭头

- [x] 18.1 `MovementCategoryView.vue`：移除 `<th>` 的 `sortable` class 及 `.data-table th.sortable::after` CSS
- [x] 18.2 冒烟：异动类型列表表头无 ⇅ 箭头；`npm run build` 通过

## 19. 本阶段屏蔽类别新增/删除

- [x] 19.1 `movement-category-config/spec.md` §19：固定四类、屏蔽 Create/Delete、Edit 时 code 只读、原因弹窗 CRUD 保留
- [x] 19.2 `MovementCategoryView.vue`：移除 toolbar 新增/删除、勾选列、Delete ConfirmDialog；保留 Edit + 设置原因
- [x] 19.3 `MovementCategoryFormModal.vue`：Edit 模式下 categoryCode 只读
- [x] 19.4 冒烟：4 行 seed 可见；无新增/删除入口；Edit + Set Reason 正常；`npm run build` 通过

## 20. 编辑弹框布局与转专业选课选项

- [x] 20.1 `movement-category-config/spec.md` §20：布局对调、开关—下拉联动、PT001 选课三 checkbox
- [x] 20.2 `MovementCategoryFormModal.vue`：Row2 开关 / Row3 下拉；`:disabled` 联动；PT001 选课区 + watch 清 #3
- [x] 20.3 `movementCategories.js`：`normalizeRow`、empty form、PT001 seed 三字段
- [x] 20.4 `en.js` / `zh.js`：选课相关 i18n
- [x] 20.5 冒烟：DEF001 学籍状态开关 ON 时 disabled；PT001 见选课区；取消预置时 #3 清空；`npm run build` 通过

## 21. 处理选课区 UI 修正

- [x] 21.1 `movement-category-config/spec.md` §21：三项独立、标签首行对齐、字号 13px
- [x] 21.2 `MovementCategoryFormModal.vue`：移除 preset→exclude watch/disabled；选课区 markup/CSS 按 design §31
- [x] 21.3 冒烟：PT001 三项任意组合可保存；「处理选课」与首项同行；字号与弹框一致；`npm run build` 通过

## 22. 处理选课扩展至四类异动

- [x] 22.1 `movement-category-config/spec.md` §22：四类 Edit 均展示选课区；REMOVED PT001-only
- [x] 22.2 `MovementCategoryFormModal.vue`：移除 `isProgrammeTransfer` / `v-if`；选课区四类均可见
- [x] 22.3 `movementCategories.js`：DEF/WDR/RES seed 显式三字段 `false`（可选）
- [x] 22.4 冒烟：四类 Edit 均见选课区；非 PT 默认未勾选；保存持久化；`npm run build` 通过
