## 1. 共享附件只读组件

- [x] 1.1 创建 `MovementAttachmentReadonly.vue`：边框容器、标签行（Upload Attachment *）、右侧 Download Consent Letter、下方文件图标+蓝色链接
- [x] 1.2 实现 mock 行为：Download Consent Letter → alert hint；文件名点击 → preview 占位提示
- [x] 1.3 props 支持各模块 i18n key（labelKey / downloadLabelKey / consentHintKey）

## 2. 转专业详情 Modal

- [x] 2.1 `ProgrammeTransferDetailModal.vue`：移除 approval-box、ConfirmDialog、approval 相关 script/import
- [x] 2.2 移除 Section VII 整块及 `adminForm` / `showSectionSevenEdit`
- [x] 2.3 移除 meta 行 `approvalStage`；移除 header `officeSubtitle`（可选）
- [x] 2.4 Documents Section 改用 `MovementAttachmentReadonly`
- [x] 2.5 `ProgrammeTransferView.vue`：移除 `@approve` / `handleApprove`

## 3. 休学 / 复学 / 退学详情 Modal

- [x] 3.1 `DefermentDetailModal.vue`：移除审批区；Documents 改用共享组件；移除 approvalStage
- [x] 3.2 `ResumptionDetailModal.vue`：同上
- [x] 3.3 `WithdrawalDetailModal.vue`：同上
- [x] 3.4 三 View：移除 `@approve` / `handleApprove`

## 4. 表单附件区布局（对齐图示，可选一致化）

- [x] 4.1 四 `*FormModal.vue`：`documents-row` 调整为标签+Download 同行、Select File 在下方（与只读组件视觉统一）
- [x] 4.2 确认 Form 校验与 Select File 行为不变

## 5. i18n

- [x] 5.1 确认各模块 `uploadAttachment` / `downloadConsent` / `consentLetterHint` key 可被共享组件使用
- [x] 5.2 如需新增 `movementAttachment.previewHint` 等共享 key，同步 `zh.js` / `en.js`（使用 `common.attachmentPreviewHint`）

## 6. 验证

- [x] 6.1 冒烟：四模块 Details 无审批 UI、无 Section VII（转专业）、字段与 Form 一致
- [x] 6.2 冒烟：附件区布局对齐图示；Download Consent Letter 可点击
- [x] 6.3 冒烟：列表流转日志仍正常；Edit/Resubmit/Cancel 等申请侧操作不受影响
- [x] 6.4 `npm run build` 通过

## 7. OpenSpec 文档（可选）

- [ ] 7.1 归档时 supersede `add-programme-transfer-app` Phase 4「Pending 审批区保留」描述
