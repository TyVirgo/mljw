# 休学期间字段 Tooltip

## 背景
用户需了解休学期间下拉可选「申请日期之前（休学补回）」与「之后」的学期。

## 变更内容
- 休学表单「休学期间」标签旁增加 `?` tooltip，文案对齐原型
- 管理端与学生端共用 `DefermentFormModal`

## 影响
- `DefermentFormModal.vue`、`movement-form.css`、i18n `deferment.fields.defermentPeriodHint`
