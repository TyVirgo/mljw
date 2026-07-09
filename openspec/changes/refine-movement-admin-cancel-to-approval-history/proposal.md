# AC 撤销入口迁至审批历史 Tab

## 背景
AC 终止进行中异动申请的「撤销」原在申请（管理端）与维护列表；产品要求收敛至审批模块历史 Tab 列表行。

## 变更内容
- **新增**：学籍异动审批 · 历史 Tab · In Progress 行 · 列表「撤销」（含 tooltip）
- **移除**：学籍异动申请（管理端）四类列表撤销
- **移除**：学籍异动维护列表撤销
- 不在详情抽屉 footer 增加撤销
- 学生「取消」逻辑不变；更新学生 tooltip 指引至审批历史 Tab

## 影响
- `MovementApprovalView.vue`、`MovementAdminCancelAction.vue`
- 四类 `*View.vue`、`MovementMaintenanceView.vue`、i18n
