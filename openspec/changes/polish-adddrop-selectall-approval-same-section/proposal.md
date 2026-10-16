## Why

全选在无可选项时仍可点；审批表教师列溢出遮挡名额；加课需禁同课同分组，重修应允许同课。

## What Changes

- 选课器/审批表头全选：无可选行时 disabled
- 审批课程汇总表：列宽、ellipsis、字号，防重叠
- AddDrop：同课同分组校验（勾选提示 + 禁提交）；RetakeDrop 取消同课一律禁止

## Capabilities

### New Capabilities

- `adddrop-selectall-approval-same-section`: 全选态、审批列布局、同课同分组规则

## Impact

- `AddDropCoursePickerModal`、`AddDropApprovalModal`、`addDropFormSections`、i18n
