# 知情同意书「适用学生范围」字段

## 背景
新增知情同意书表单需在备注前配置可选的「适用学生范围」，主列表同步展示；空值显示「—」。

## 变更内容
- 新建/编辑弹框：Remark 前增加非必填下拉「适用学生范围」
- 选项：第一年、第二年及以上
- 主列表新增同名列（专业层级与 Remark 之间）
- 查看详情弹框同步展示
- 不参与模板匹配唯一键（本期仅配置与展示）

## 影响
- `consentForms.js`、`ConsentFormFormModal.vue`、`ConsentFormView.vue`、`ConsentFormViewModal.vue`、i18n
