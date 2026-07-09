# 转专业状态日志备注（审批/生效学年学期）

## 背景
学籍 Status Log 中转专业备注需对齐 legacy「学籍异动说明」格式，展示审批通过学年学期与生效学年学期，数据来自已批准转专业申请。

## 变更内容
- Implement 时追加 Status Log（转专业不改学籍状态 `modifyStudentStatus: false`）。
- 备注首行：`Programme transfer, {oldCode} to {newCode}, approved in {applicationSession}, effective from {adminNewIntake|startSemester}`。
- 更新演示 mock。

## 影响
- `programmeTransferStatusLog.js`、`students.js`、`programmeTransfers.js`（re-export）
- `movementMaintenanceFields.js` / `movementApprovalEngine.js`（已有 movementContext）
