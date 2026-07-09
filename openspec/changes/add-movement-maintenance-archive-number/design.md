## 字段

复用 store 字段 `exportArchiveNumber`，与 `buildMovementFormPdfFilename` / `buildMovementAttachmentExportFilename` 一致。

## 列表布局

```
状态 | 审批环节 | 实施 | 文号 | 学号 | 姓名 | … | 操作（修改文号 | 详情 | 导出 PDF）
```

文号列位于 **学号列前一列**（实施状态之后）。

## PDF 命名

```
resolveMovementExportArchiveNumber(item):
  status !== Approved → 'NA'
  exportArchiveNumber 有值且非 'NA' → 使用该值
  否则 → 'NA'

文件名：{文号}. {学号} {姓名} - {表单类型}.pdf
```

## 校验

`^[A-Za-z0-9]{1,100}$`，保存前校验，失败提示 `movementMaintenance.archiveNumberInvalid`。

## 弹窗

`MovementArchiveNumberModal` 单行编辑，展示学号·姓名副标题，Cancel / Save。
