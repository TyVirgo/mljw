## Context

学生维现约 16 数据列 + 5 列右 sticky；`adminAddReason` / `adminAddAttachment` 已在代选写入。

## Goals / Non-Goals

**Goals:** 主表无横向滚动（常见桌面宽）；详情补全隐列与原因附件  
**Non-Goals:** 不改代选录入；不改课程维

## Decisions

### 1. 主表列

`勾选 | 序号 | 学号(左冻) | 姓名(左冻) | 课号 | 课名 | 操作结果(右冻) | 详情`

### 2. 详情抽屉

只读 `dl` 列表；附件仅展示文件名（demo 无二进制）；空值 —。

### 3. 导出

`resultStudentExportFields` 增加 `adminAddReason`、`adminAddAttachmentName`。

## Risks / Trade-offs

- [Trade-off] 课名过长仍可能挤压 — 主表课名可 ellipsis，全文在详情

## Migration Plan

无。

## Open Questions

无。
