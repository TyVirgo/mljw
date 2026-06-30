## 1. 公共预览能力

- [x] 1.1 `attachment-preview/spec.md`：Trigger、Modal、mock/blob 策略、下载与预览分离
- [x] 1.2 新增 `src/utils/attachmentPreview.js`（扩展名、mock HTML、blob URL 生命周期）
- [x] 1.3 新增 `AttachmentPreviewModal.vue`（PDF/图片 iframe|img、DOCX 占位、mock 提示）
- [x] 1.4 新增 `AttachmentPreviewTrigger.vue`（文件名 + 👁，接 Modal）

## 2. 异动详情（审批 / 维护 / 查询）

- [x] 2.1 重构 `MovementAttachmentReadonly.vue`：文件名下载 + 👁；移除 alert 占位预览
- [x] 2.2 冒烟：四 Tab DetailModal / ReviewView 附件区可见 👁 且可开 Modal

## 3. 异动申请 Form

- [x] 3.1 `ProgrammeTransferFormModal.vue`：Documents 区 file-row 加 Trigger；`onFileChange` 保留 localFile
- [x] 3.2 `DefermentFormModal.vue`：同上
- [x] 3.3 `ResumptionFormModal.vue`：同上
- [x] 3.4 `WithdrawalFormModal.vue`：同上

## 4. 知情同意书

- [x] 4.1 `ConsentFormFormModal.vue`：学生/家长 upload 行加 👁
- [x] 4.2 `ConsentFormViewModal.vue`：只读附件行加 👁

## 5. i18n 与验证

- [x] 5.1 `en.js` / `zh.js`：`previewAttachment`、`attachmentPreview.*`；必要时调整 `attachmentPreviewHint` 用途
- [x] 5.2 冒烟：刚选 PDF 真预览；种子数据 mock 预览；无文件无 👁
- [x] 5.3 冒烟：文件名下载与 👁 预览互不干扰
- [x] 5.4 `npm run build` 通过
