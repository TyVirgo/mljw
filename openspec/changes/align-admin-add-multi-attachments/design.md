## 决策

1. UI 对齐 `AddDropApplicationFormSections` 退课附件区（soft 按钮 + attach-list + AttachmentPreviewTrigger）
2. 上限 5；可选；现有 `addAttachmentLabel` / `addAttachmentOptional` 保留，另补「最多 n 个」
3. 落库主键 `adminAddAttachments`；同步写 `adminAddAttachment = 首项` 兼容旧读路径并 `@deprecated`
4. `resolveAdminAddAttachments(row)` 统一详情/导出读取

## 风险

- [旧行仅单附件] → resolve 回退单字段
