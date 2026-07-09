# 异动维护/查询列表 Preview PDF

## 背景
维护与查询列表需在不打开详情抽屉的情况下，快速预览与详情一致的 PDF 内容并支持下载。

## 变更内容
- 操作列「详情」右侧增加 **Preview PDF** 按钮
- 弹窗内 iframe 预览客户端生成的 PDF（与详情抽屉 Export PDF 同源内容）
- 弹窗 footer 提供 **Download PDF** 下载
- 维护/查询共用 `MovementDetailPdfPreviewModal`；护照/IC 等敏感字段沿用列表详情 masking 规则

## 影响

- `exportMovementDetailPdf.js` — 抽取 blob 生成能力
- 新增 `MovementDetailPdfPreviewModal.vue`
- `MovementMaintenanceView.vue`、`MovementQueryView.vue`
- i18n `movementExport.previewPdf` / `downloadPdf` / `previewPdfTitle` / `generatingPdf`
