# 异动详情审批日志表格与 PDF/附件导出

## 背景
管理端需按原型以表格展示审批日志；管理端申请详情支持导出 PDF；附件需 demo 与规范命名导出。

## 变更内容
- 所有详情抽屉：申请内容在上、Approval Log 四列表格在下（非流程时间线）
- 仅学籍异动申请（管理端）Footer 增加「导出 PDF」（含附件列表）
- Approved 导出序号随机生成；未 Approved 为 `NA.`
- 附件 demo + Export；PDF/附件命名含 Programme Transfer 等后缀
- Created At：`YYYY-MM-DD HH:mm:ss`
- 详情不展示「下载同意书」模板按钮（仅新增表单提供）
- 详情声明勾选样式与新增一致（蓝色勾选、只读不可改）
- 管理端详情 Footer：「导出 PDF」在左、「关闭」在右

## 影响
- `MovementApprovalLogTable.vue`、`movementApprovalLogDisplay.js`、`movementExportNames.js`
- `MovementApplicationDetailDrawer.vue`、`MovementAttachmentReadonly.vue`、`MovementAttachmentsReadonly.vue`
- `MovementDeclarationSection.vue`、`movement-form.css`
- `jspdf` / `html2canvas`、i18n、mock 数据
