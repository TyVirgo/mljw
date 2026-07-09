## 背景说明

四异动详情 Modal 当前结构（以转专业为例）：

```
┌─ Detail Modal ─────────────────────────────────────┐
│  Meta: AppId | Status | Approval Stage             │
│  Section I–IV (申请内容)                            │
│  Section VII (教务) ← 仅转专业，且 In Progress 可编辑 │
│  approval-box (Action/Comment/Submit) ← 四模块均有   │
└────────────────────────────────────────────────────┘
```

导航 IA（`restructure-student-records-navigation`）：

```
学籍异动申请 Tab → 四 View → Details（学生侧只读）
学籍异动审批     → 未来独立模块 → 审批 + 流转
列表 Actions     → 流转日志（已有 ApprovalLogModal）
```

图示附件区（详情只读）：

```
┌──────────────────────────────────────────────────────────┐
│ Upload Attachment * :          [Download Consent Letter ↓]│
│ 📄 Existing Attachment.pdf                               │
└──────────────────────────────────────────────────────────┘
```

## 目标 / 非目标

**目标：**

- 详情 = 表单申请字段的只读镜像（不含 Section VII、不含审批 UI）
- 共享附件只读组件，四模块一致
- 审批能力从 UI 剥离但 data 层保留

**非目标：**

- 新建审批模块页面
- 改状态机或 mock 条数

## 设计决策

### 1. 详情 vs 表单字段对齐表

**ProgrammeTransferDetailModal** 保留：

- Section I Student Details（7 字段）
- Section II Transfer Information
- Section III Declaration（Yes/No 或完整声明摘要）
- Section IV Documents → `MovementAttachmentReadonly`

**移除：**

- Section VII 整块
- `showSectionSevenEdit` / `adminForm` / `canEditSectionSeven`
- header `officeSubtitle`
- `approval-box` 与 `ConfirmDialog`

**Deferment / Withdrawal** — 保留至 Parent Consent 为止；**Resumption** — 保留 Declaration section。

### 2. 共享组件 `MovementAttachmentReadonly.vue`

```vue
props:
  fileName: String | null      // item.attachment?.fileName
  labelKey: String             // e.g. programmeTransfer.fields.uploadAttachment
  downloadLabelKey: String     // e.g. programmeTransfer.fields.downloadConsent
  consentHintKey: String       // alert hint on download
  required: Boolean (default true)
```

**布局 CSS（scoped）：**

```css
.attachment-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
}
.attachment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.attachment-file-link {
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
```

**行为：**

- 有 `fileName`：显示可点击链接（mock：`window.alert` 或 noop）
- 无附件：`—` 或 i18n 占位
- Download Consent Letter：emit 或内部调用 `downloadConsentLetter` 模式（alert hint）

### 3. DetailModal 精简模式

```javascript
// 删除
emit: ['close', 'edit']  // 移除 'approve'

// 删除 imports
programmeTransferApproval.js / canApproveTransfer / ...

// meta-row 仅保留
applicationId + statusBadge
```

**DefermentDetailModal** 保留 footer Edit（`canEditDeferment`）— 属于申请侧操作，非审批。

### 4. View 层清理

```javascript
// ProgrammeTransferView.vue 等
// 删除 handleApprove、DetailModal @approve
// upsert 逻辑不再从 Detail 触发
```

列表若曾依赖详情内审批推进状态，冒烟需确认：In Progress 记录仍可通过 mock 初始数据演示；**本 change 不提供替代审批入口**（待审批模块）。

### 5. Form Modal documents-row 对齐（建议首版一并做）

将现有 `documents-row`（左 field + 右 consent 按钮）改为：

```
┌─ documents-panel（与 readonly 同边框风格）─────────────┐
│ label *                           [Download Consent ↓]  │
│ [Select File]  filename / hint                          │
└─────────────────────────────────────────────────────────┘
```

Form 保留 Select File + validation；Readonly 仅展示链接。

**可选**：抽取 `MovementAttachmentField.vue`（editable）与 Readonly 共享 header 行样式——若 scope 过大则仅 Readonly + Form 局部 CSS 复制。

### 6. i18n

复用各模块现有 key：

- `*.fields.uploadAttachment`
- `*.fields.downloadConsent`
- `*.consentLetterHint`

无需新增 flat 映射 unless 新英文 hardcode。

### 7. OpenSpec 与 add-programme-transfer-app 关系

本 change 作为 **Phase 5 / 增量**，部分取代：

- proposal Phase 4「详情 Modal 移除内嵌 log；**Pending 审批区保留**」→ 改为 **审批区也移除**
- spec 中「Details modal supports admin approval」类 requirement → MODIFIED

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 移除详情审批后无法 demo 推进流程 | 列表流转日志 + mock 预置多阶段数据；审批模块后续补入口 |
| Form/Detail 附件样式两套 | 共享 header 样式 class 或只读组件 + Form 复制 CSS |
| 转专业 Section VII 仅在 Form 可见，用户困惑 | 设计文档说明；Form Notes 可补充「教务字段仅审批流程填写」 |

## 迁移说明

1. 新增 `MovementAttachmentReadonly.vue`
2. 逐个改四 `*DetailModal`（先转专业，再休学/复学/退学）
3. 清理四 `*View` approve 绑定
4. （可选）统一四 Form documents 布局
5. 冒烟 + build
6. 更新 `add-programme-transfer-app` 相关 spec delta 说明（归档/sync 时）

## 待决问题

1. 详情 Declaration 展示：checkbox 结果「Yes/No」还是完整声明条文只读？→ **首版保持现有 Yes/No 或简短摘要**
2. Form Section VII 是否在 Create 时也隐藏？→ **非目标，Form 保持现状**
3. 文件名链接点击行为？→ **mock alert「Preview not available in demo」**
