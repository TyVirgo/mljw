## 背景说明

学籍异动附件当前仅存 mock 元数据 `{ fileName, size }`；Form 上传时浏览器短暂持有 `File` 对象。`MovementAttachmentReadonly` 点击文件名触发 `common.attachmentPreviewHint` alert。知情同意书 View 仅支持 mock 下载。无全站统一预览组件。

产品要求：附件旁 👁 在线预览；覆盖知情同意书、四 Tab 申请 Form、审批/维护/查询/详情只读附件区。

## 目标 / 非目标

**目标：**

- 公共 `AttachmentPreviewTrigger` + `AttachmentPreviewModal`
- Mock 预览使种子数据可演示；刚上传文件可 blob 真预览
- 文件名下载、小眼睛预览职责分离
- 单点改造 `MovementAttachmentReadonly` 覆盖审批/维护/查询详情

**非目标：**

- 后端 `/files/{id}/preview`
- DOCX inline 渲染
- 非学籍异动 / 非同意书模块
- 版本历史 remark 文本行上的附件名

## 设计决策

### 1. 组件分层

```
AttachmentPreviewTrigger
├── props: fileName, fileMeta?, localFile?, label?
├── slot: 可选自定义文件名展示
├── 右侧: AttachmentPreviewEyeButton（icon-only, aria-label）
└── emit / inject: open preview

AttachmentPreviewModal
├── props: visible, fileName, previewUrl?, previewMode ('blob'|'mock-pdf'|'mock-image'|'unsupported')
├── 标题: fileName
├── 内容区: iframe | img | mock 占位 HTML
└── footer: Close
```

父级 Form 可在 `onFileChange` 时保留 `localFileRef`（`ref(null)`），Save 后清空；Edit 打开仅有 `fileMeta` 时走 mock。

### 2. `attachmentPreview.js`

```javascript
export function getAttachmentExtension(fileName)
export function resolvePreviewMode(fileName, localFile = null)
// → 'blob-pdf' | 'blob-image' | 'mock-pdf' | 'mock-image' | 'mock-docx' | 'unsupported'

export function buildMockPreviewHtml(fileName, fileMeta)
export function createBlobPreviewUrl(localFile)  // caller revokes on close

export function downloadAttachmentMock(fileName, label)  // 复用/对齐 consentFormDownload 模式
```

Mock PDF：简单 HTML 页「Mock preview: {fileName}」或内嵌 data URL 占位；与 demo 下载文本一致风格。

### 3. UI 布局 — 附件行

```
┌────────────────────────────────────────────────────────┐
│ 📄 deferment-consent-signed.pdf   [👁]                 │
└────────────────────────────────────────────────────────┘
     ↑ 点击下载 mock              ↑ 点击打开 PreviewModal
```

样式：👁 为 icon button，`#6b7280` hover `#2563eb`；与现有蓝色文件名 link 对齐 `gap: 8px`。

### 4. MovementAttachmentReadonly 改造

- 文件名改为 **下载** 行为（mock blob，与 consent 下载 helper 类似或共用 `downloadAttachmentMock`）
- 旁挂 `AttachmentPreviewEyeButton`
- 移除 `previewAttachment` → alert

Props 可选扩展 `attachment` 对象 `{ fileName, size }`（已有 `fileName` prop 可保留）。

### 5. 四 Tab FormModal 改造

在 `file-row` 内，`file-name` span 旁条件渲染 👁：

```vue
<AttachmentPreviewTrigger
  v-if="form.attachment?.fileName"
  :file-name="form.attachment.fileName"
  :file-meta="form.attachment"
  :local-file="pendingLocalFile"
/>
```

`onFileChange` 时：`pendingLocalFile = file`；Save/关闭 modal 时 `pendingLocalFile = null`。

### 6. ConsentFormFormModal / ViewModal

- 学生、家长各一行：文件名 + 👁（有 fileName 时）
- ViewModal：download 保留在文件名或单独；👁 预览 mock 模板

### 7. i18n

```javascript
common.previewAttachment: 'Preview' / '预览'
common.previewUnsupported: 'Preview is not available for this file type.'
attachmentPreview.title: 'Attachment Preview'
attachmentPreview.mockNotice: 'Demo preview — file content is simulated.'
```

### 8. 文件清单

```
新增:
  src/components/common/AttachmentPreviewTrigger.vue
  src/components/common/AttachmentPreviewModal.vue
  src/utils/attachmentPreview.js

修改:
  MovementAttachmentReadonly.vue
  ConsentFormFormModal.vue, ConsentFormViewModal.vue
  ProgrammeTransfer/Deferment/Resumption/Withdrawal FormModal.vue
  en.js, zh.js
```

## 风险与应对

| 风险 | 缓解 |
|------|------|
| Edit 后无 blob，与刚上传体验不一致 | Modal 顶栏 mock 提示文案 |
| blob URL 泄漏 | Modal close / unmount 时 `URL.revokeObjectURL` |
| iframe 跨域 | 仅用 blob: 同源 |
| 多处重复 file-row | 优先抽 Trigger，Form 各 1 行改动 |

## 迁移说明

无数据迁移。`common.attachmentPreviewHint` 可保留给 truly unsupported 类型，或废弃改为 Modal 内文案。
