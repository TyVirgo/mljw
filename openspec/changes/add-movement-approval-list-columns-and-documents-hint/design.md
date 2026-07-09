# 设计
## 历史申请次序

同 `studentId` + `sourceKey`（四异动），排除 Draft，按 `submittedAt` 升序排名；始终从 1 开始显示。

## Last Action Time

`approvalLog` 中 action 为 Approved / Rejected / Update Required 的最新 `dateTime`，格式 `YYYY-MM-DD HH:mm:ss`（与 Created At 一致）。无审批动作显示 —。

## 表头 Tooltip

`MovementApprovalTableHeaderLabel`：列名 + `?` 图标，i18n `movementApproval.columnHints.*` 说明含义与 — 规则。

## 附件 hint

每附件行 `.file-row` 下方展示 `hintKey` 文案，class `hint-text`。
