# 休学起止时间与状态日志备注

## 背景
休学申请需展示所选「休学期间（YYYY/MM）」对应的学期起止日期，并在学籍状态日志的休学记录备注中体现本次休学的日期区间（参考 legacy 学籍异动说明格式，不含复学内容）。

## 变更内容
- 管理端与学生端休学表单 Section II：在「休学期间」下一行增加只读字段「休学开始时间」「休学结束时间」（dd/MM/YYYY），随所选期间从 `semesterInfo` 基础数据联动带出并持久化到申请记录。
- 休学详情、异动详情只读展示上述字段。
- 异动维护 Implement 回写学籍时，在 Status Log 休学行 `remarkLines` 增加 `{N}th Deferment: {start}-{end}` 及现有 Period/Reason 行。

## 影响
- `src/data/deferments.js`、`src/data/semesterInfo.js`、`src/data/students.js`
- `DefermentFormModal.vue`、`DefermentDetailModal.vue`、`MovementDetailContent.vue`
- `movementMaintenanceFields.js`、`movementApprovalEngine.js`
- i18n：`deferment.fields.defermentStartDate` / `defermentEndDate`
