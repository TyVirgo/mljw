# 异动原因「适用人员类别」

## 背景
异动原因需区分老师端与学生端可见范围；原配置无法按端精确控制原因下拉选项。

## 变更内容
- 设置异动原因：除原因名称外，增加必填「适用人员类别」**多选下拉**
- 选项：**老师 / 学生**（已移除「全部」）；**默认同时勾选老师 + 学生**
- 列表展示：`老师、学生` 等；新增/编辑同步
- 休学/退学申请原因按 applicantMode 过滤（原因 categories 含 Teacher/Student 即对该端可见）

## 影响
- `MovementCategoryReasonEditModal.vue`、`MovementCategoryReasonModal.vue`
- `movementCategories.js` — `applicablePersonnelCategories` 字段
- 休学/退学申请表单原因下拉过滤逻辑
