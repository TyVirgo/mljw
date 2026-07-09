## 抽屉布局

```
MovementDetailContent（申请详情 + 附件）
MovementApprovalLogTable（四列，日志顺序）
Footer: [导出 PDF]* [关闭] …   *仅 enableExportPdf
```

## Approval Log 列

| Description | Action By | Action By Role | Created At |
| Submitted → Application Submitted | actor | actorRole / 映射 | YYYY-MM-DD HH:mm:ss |
| 其他 | actor | 映射 | 同上 |

## 导出命名

- PDF：`{序号}. {学号} {姓名大写} - {FormType} Form {可选 YYYYMM}`
- 附件：`{序号}. {学号} {姓名}_ {DocType}_{MovementType}.ext`
- Approved：`resolveExportArchiveNumber` 稳定随机；否则 `NA`

FormType / MovementType：`Programme Transfer` | `Deferment` | `Resumption` | `Withdrawal`

## 详情附件与声明

- 详情（抽屉 / DetailModal）**不展示**「Download Consent Letter / 下载同意书」；该按钮仅在 `*FormModal` 新增/编辑上传区保留
- 详情声明：`MovementDeclarationSection` 只读时 checkbox 视觉与新增表单一致（蓝色勾选），不可交互
- Footer 按钮顺序（管理端 PDF）：`[导出 PDF] [关闭] [撤销?] [审批?]`
