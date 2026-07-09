# 审批列表列 + 附件提示布局

## 背景
审批主表需展示该生该类型历史第几次申请及最近审核时间；附件上传区「支持格式」提示应位于选择文件按钮下方并以 hint 样式展示。

## 变更内容
- 主表（仅 `MovementApprovalView`）异动类别后新增：历史申请次序、Last Action Time
- 四异动均按 studentId + 类型从 1 累计申请次序
- Last Action Time：有审批动作显示时间（同 Created At）；无审批显示 —
- 两列表头带 tooltip 说明字段含义
- Excel 导出包含两列（默认选中）
- 附件 hint 移至每行选择文件下方

## 影响
- `movementApprovalQueue.js`、`MovementApprovalView.vue`、export 配置、i18n
- `MovementDocumentsUploadSection.vue`
