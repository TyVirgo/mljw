# 异动原因「适用人员类别」多选

## 背景
异动原因需区分老师端与学生端可见范围；原「全部」单选无法表达双端共用或单端专用的配置需求。

## 变更内容
- 去掉「全部」选项，仅保留 **老师 / 学生**
- 单选改为 **多选下拉**（checkbox 面板）
- **默认勾选老师 + 学生**
- 主列表展示：`老师、学生` / `老师` / `学生`
- 新增/编辑/列表同步；休学/退学原因过滤按数组 includes

## 影响
- `movementCategories.js` — `applicablePersonnelCategories[]`、迁移旧 `All`/字符串
- `MovementCategoryReasonEditModal.vue` — 多选下拉
- `MovementCategoryReasonModal.vue` — 列表格式化
