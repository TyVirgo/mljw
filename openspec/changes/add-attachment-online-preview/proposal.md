## Why

学籍异动与知情同意书模块中，用户上传附件后仅显示文件名；详情页点击文件名会弹出「演示环境暂不支持文件预览」。产品要求在**附件文件名旁增加小眼睛（在线预览）**，使申请、审批、维护、查询及知情同意书配置在演示阶段即可「点眼即看」，形成与下载并列的附件操作习惯。

## What Changes

### 公共能力

- 新增可复用 **附件预览触发器**（文件名 + 👁 小眼睛）与 **预览 Modal**（Teleport 全屏/大弹窗）
- 预览策略（原型）：
  - **刚上传、内存中仍有 `File`** → 使用 `URL.createObjectURL` 真实预览（PDF / 图片）
  - **已保存 mock 数据（仅 `fileName` + `size`）** → 按扩展名展示 mock 占位内容（与现有 mock 下载一致的可演示体验）
- **文件名点击** → 保留下载（mock blob）；**小眼睛** → 打开预览 Modal（职责分离）

### 知情同意书（`consent-form-config`）

- `ConsentFormFormModal`：学生/家长附件 Upload 完成后，文件名旁显示 👁
- `ConsentFormViewModal`：只读附件文件名旁显示 👁
- 「Download Consent Letter」模板按钮**不**加预览眼（非用户上传附件）

### 异动申请（四 Tab FormModal）

- `ProgrammeTransferFormModal`、`DefermentFormModal`、`ResumptionFormModal`、`WithdrawalFormModal`
- Documents 区：选文件并显示 `fileName` 后，文件名旁显示 👁
- Edit 模式打开已有附件时，👁 走 mock 预览

### 异动详情（审批 / 维护 / 查询 / 申请 Details）

- 收敛于 `MovementAttachmentReadonly`：文件名行增加 👁；移除「点击文件名 = alert 占位」行为，改为下载或仅展示 + 眼预览
- 四 Tab `*DetailModal` 经 ReviewView 或列表 Details 自动受益

### 支持格式（首版）

| 类型 | 预览 |
|------|------|
| PDF | iframe / object 或 mock 占位页 |
| JPG / PNG | img 或 mock 占位 |
| DOCX | Modal 内说明「需后端转换」+ 文件摘要，不 inline 渲染 |

## Capabilities

### New Capabilities

- `attachment-preview`: 公共预览组件、mock 策略、`resolveAttachmentPreview` helper

### Modified Capabilities

- `consent-form-config`: Form/View 附件行增加在线预览
- `movement-application-details`: Form Documents 区与 `MovementAttachmentReadonly` 增加在线预览

## Impact

- **新增**
  - `src/components/common/AttachmentPreviewTrigger.vue`（或 `AttachmentFileRow.vue`）
  - `src/components/common/AttachmentPreviewModal.vue`
  - `src/utils/attachmentPreview.js`（mock 内容、扩展名判断、blob URL 生命周期）
- **修改**
  - `ConsentFormFormModal.vue`、`ConsentFormViewModal.vue`
  - 四 Tab `*FormModal.vue`
  - `MovementAttachmentReadonly.vue`
  - `src/i18n/locales/en.js`、`zh.js`
- **Non-goals**
  - 讲师信息、培养方案、课程等其他模块附件
  - 真实文件存储 / 后端 preview API
  - DOCX 在线渲染、OCR、水印
  - 知情同意书历史版本日志 `remarkLines` 内纯文本附件名（无独立文件行）

## Decisions（探索阶段已确认）

| 项 | 决策 |
|----|------|
| 预览内容 | Mock 占位 + 本次会话刚选文件的 blob 真预览 |
| 文件名 vs 👁 | 文件名 → 下载；👁 → 预览 |
| 无文件 | 隐藏 👁 |
| 预览容器 | Modal 内嵌 |
| 审批/维护/查询 | 改 `MovementAttachmentReadonly` 单点覆盖 |
