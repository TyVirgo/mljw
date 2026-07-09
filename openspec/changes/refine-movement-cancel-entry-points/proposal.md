# 收窄异动 Cancel / 撤销入口

## 背景
查询、审批页不应提供业务型撤销；学生「取消」与教务「撤销」需区分说明；管理端申请页需保留 AC 代撤销能力。

## 变更内容
- 管理端 **撤销**：「学籍异动申请（管理端）」+「学籍异动维护」列表（In Progress / 进行中·审批中）
- 学生 **取消**：仅学生申请页，审批开始前（Pending Review + 未开始审批），带 tooltip「取消说明」三条文案（与申请管理端「撤销」区分）
- 查询、审批：无 Cancel / 撤销按钮

## 影响
- `MovementStudentCancelAction.vue`、`MovementAdminCancelAction.vue`
- 四类 `*View.vue`（学生取消 + 管理端撤销）、Query / Approval 无 Admin Cancel
- `movementAdminCancel.*` / `movementStudentCancel.*` i18n
