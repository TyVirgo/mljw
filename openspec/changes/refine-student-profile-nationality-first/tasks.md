## 1. 数据层与共享逻辑

- [x] 1.1 在 `src/data/nationalityOptions.js` 新增全球国籍列表及 `getNationalityOptionsForSelect()`（Malaysia、China 置顶）
- [x] 1.2 在 `src/data/students.js` 新增 `resolveCategoryFromNationality()`、`clearCategorySpecificFields()`；`createEmptyStudent()` 默认 `studentCategory` 为空
- [x] 1.3 更新 `validateStudentForm()`：国籍必填；保存前确保 `studentCategory` 与 nationality 一致
- [x] 1.4 重构 `movementApprovalEngine.inferStudentCategory()` 复用 `resolveCategoryFromNationality()`

## 2. 通用组件

- [x] 2.1 新建 `src/components/common/SearchableSelect.vue`（可搜索下拉，支持 filter + 选项选择）
- [x] 2.2 补充 i18n：`nationalitySectionTitle`、`entrySectionTitle`、`selectNationalityFirst`、`nationalityChangeConfirm` 等（zh/en）

## 3. 表单抽屉布局

- [x] 3.1 重构 `StudentProfileFormDrawer.vue`：移除 category radio；新增「国籍信息」「信息填写」分区
- [x] 3.2 集成 SearchableSelect 绑定 `form.basicInfo.nationality`；只读展示 derived Student Category
- [x] 3.3 实现 nationality watch：首次选择直接设 category；编辑改国籍致 category 变化时 confirm + 清互斥字段
- [x] 3.4 向 Tab 组件传递 `nationalitySelected`；未选国籍时显示空态占位

## 4. Tab 与详情

- [x] 4.1 更新 `BasicInfoTab.vue`：移除 Nationality 字段；可选调整字段分组排版
- [x] 4.2 更新其余 Tab 组件（Enrollment/Contact/Education/Family/Accommodation/Others）：支持 `nationalitySelected` 空态 gate
- [x] 4.3 重构 `StudentProfileDetailDrawer.vue`：同步「国籍信息 + 信息填写」两段式只读布局

## 5. 验证

- [x] 5.1 手动验证新建：未选国籍时空 Tab → 选 Malaysia/China/UK 分别带出 Local/China/International 字段
- [x] 5.2 手动验证编辑：改国籍触发确认并清理互斥字段；Save 后列表 Student Type 正确
- [x] 5.3 手动验证详情 Drawer 布局与表单一致

## 6. 步骤式布局精修

- [x] 6.1 未选国籍时整块隐藏「信息填写」区块（标题、Tab、字段均不展示）
- [x] 6.2 「国籍信息」「信息填写」标题前增加步骤序号 1 / 2 徽章（表单与详情 Drawer）
- [x] 6.3 保存按钮保持可点；未填国籍时校验提示「请选择国籍」
- [x] 6.4 同类别内切换国籍不 confirm；仅类别变化时 confirm 并清互斥字段
- [x] 6.5 更新 spec：隐藏区块、步骤序号、保存校验、切换国籍行为
