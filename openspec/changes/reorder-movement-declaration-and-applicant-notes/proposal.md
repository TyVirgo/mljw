# 异动申请声明后移与申请人说明

## 背景
正常流程应为：填写信息 → 上传附件 → 勾选声明 → 提交。当前四类表单声明在附件之前；退学缺 Instructional Note，休学/复学缺顶部说明。

## 变更内容
- 声明区块移至附件之后；Section 按新顺序重编号
- 退学增加 6 条 Instructional Note（图示2）；休学/复学增加 demo 说明（结构同转专业）
- 复学 `noteAlert` 保留在表单末尾
- 中文/英文 i18n 分离；详情视图顺序与表单一致

## 影响
- 四类 `*FormModal.vue`、`MovementDetailContent`、各 `*DetailModal.vue`
- `MovementApplicantNotes.vue`、i18n
