# 设计
## PDF 内容范围

与 `MovementApplicationDetailDrawer` 导出根节点一致：

```
MovementDetailContent
+ ProgrammeTransferOfficeUseSection（仅 programme-transfer 且 Approved）
+ MovementApprovalLogTable
```

## 生成流程

```
点击 Preview PDF
    → Modal 打开，离屏渲染 export root
    → html2canvas + jsPDF → blob URL
    → iframe 预览
    → Download 触发 blob 下载（buildMovementFormPdfFilename 命名）
```

## UI

```
操作列：[详情] [Preview PDF]

Modal：
┌─ PDF Preview ─────────────────────┐
│ subtitle: applicationId · name    │
│ ┌───────────────────────────────┐ │
│ │ iframe (pdf blob)             │ │
│ └───────────────────────────────┘ │
│              [Download PDF] [Close]│
└───────────────────────────────────┘
```
