# 异动原因「是否允许学生申请」开关

## 背景
设置原因弹框原以「适用人员类别」多选（老师/学生）表达可见范围，与产品图示不符。业务仅需回答：该原因是否允许学生端申请。

## 变更内容
- 列表列与编辑弹框：「适用人员类别」改为 **「是否允许学生申请」** 开关（轨道上展示 **是/否**）
- **默认关**（否）→ 仅老师端可见；**开**（是）→ 学生端可见
- 列表列开关 **可直接点击** 切换并即时保存
- 数据层继续用 `applicablePersonnelCategories`：`否`→`['Teacher']`，`是`→`['Student']`

## 影响
- `YnSwitch.vue`、`movementCategories.js`
- `MovementCategoryReasonModal.vue`、`MovementCategoryReasonEditModal.vue`
- i18n
