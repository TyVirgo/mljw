# 管理端异动申请撤销（Cancel）

## 背景
管理端需在审批流程任意环节代为终止 In Progress 申请；与学生端 Early Cancel 并存，不替换 add-*-app 既有规则。

## 变更内容
- 管理端 Query / Maintenance / Approval **列表**增加 Cancel（撤销），带 tooltip 与确认弹框
- 条件：`status === 'In Progress'`（四类统一，含复学）
- 保留学生端 Pending Review 且审批未开始时的 Cancel（add-*-app 不变）
- Update Required 不提供 Cancel；不做角色校验、不做部门通知 mock
- 按钮文案统一：中文「撤销」、英文「Cancel」

## 影响
- `movementApplicationCancel.js`、`MovementAdminCancelAction.vue`
- `MovementQueryView`、`MovementMaintenanceView`、`MovementApprovalView`
- `movementAdminCancel.*` i18n；转专业 `cancelApplication` 中文标签对齐
