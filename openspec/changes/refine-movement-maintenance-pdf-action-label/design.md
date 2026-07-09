## 决策

维护与查询列表 PDF 按钮文案分化：

| 页面 | i18n key | 中文 | 行为 |
|------|----------|------|------|
| 异动维护 | `movementExport.exportPdf` | 导出 PDF | 打开 PDF 预览弹窗 |
| 异动查询 | `movementExport.previewPdf` | 预览 PDF | 打开 PDF 预览弹窗 |

两者共用 `MovementDetailPdfPreviewModal`，仅入口标签不同。

## 修复

将 `t('movementExport.')` 修正为 `t('movementExport.exportPdf')`。
