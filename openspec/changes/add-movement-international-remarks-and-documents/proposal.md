# 国际学生说明与多附件上传

## 背景
International 类别学生需额外 IO 说明与 Flight Tickets；复学需可选康复记录。现有单一 attachment 与一行 isaoNote 不足。

## 变更内容
- Applicant Notes 下方增加图示1 国际说明（仅 `International`）
- 附件区改为多行上传（同意书 + 国际 Flight Tickets * + 复学 Medical Recovery 可选）
- 保留 pdf/jpg/png/docx、5MB；移除退学末尾 isaoNoteAlert

## 影响
- `movementAttachments.js`、国际说明/多附件组件、四类 Form/Detail、i18n、校验
