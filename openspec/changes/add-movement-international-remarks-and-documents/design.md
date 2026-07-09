## 国际学生说明（图示1）

- 位置：`MovementApplicantNotes` 正下方
- 可见性：`studentCategory === 'International'`（不含 China）
- 文案：四类异动各一套 i18n key（`internationalRemarks.*`）
- 退学：用国际说明**取代**末尾 `isaoNoteAlert`，避免重复

## 多附件（图示2）

```
movementAttachments.js
  consentLetter *（所有人）
  flightTickets *（International）
  medicalRecovery（复学，可选）
  legacy attachment ← consentLetter（兼容旧读者）
```

| 字段 | 必填 | 格式 |
|------|------|------|
| Consent Letter | 是 | pdf/jpg/png/docx，5MB |
| Flight Tickets | International 必填 | 同上 |
| Medical Recovery | 复学可选 | 同上 |

## 组件

```
MovementInternationalStudentRemarks.vue   — 表单/详情只读
MovementDocumentsUploadSection.vue        — 表单多行上传
MovementAttachmentsReadonly.vue           — 详情多行只读
```

校验错误键：`attachments.consentLetter` 等（`attachmentErrorKey`）。
