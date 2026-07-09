## 1. 入口收窄

- [x] 1.1 Query / Approval 移除 `MovementAdminCancelAction`
- [x] 1.2 Maintenance 保留 Admin 撤销

## 2. 学生取消

- [x] 2.1 新建 `MovementStudentCancelAction.vue` + `movementStudentCancel.*` i18n
- [x] 2.2 四类 `*View.vue` 仅 `applicantMode === 'student'` 显示取消 + tooltip
- [x] 2.3 确认弹框改用 `movementStudentCancel.confirmMessage`
- [x] 2.4 取消 tooltip 文案：对比申请管理端「撤销」而非维护页

## 3. 管理端申请撤销

- [x] 3.1 四类 `*View.vue` 在 `applicantMode === 'teacher'` 接入 `MovementAdminCancelAction`
- [x] 3.2 更新 `movementAdminCancel` tooltip（管理端申请 + 维护页）
- [x] 3.3 tooltip 文案对齐原型（两条：入口说明 + 流程终止通知各部门）

## 4. 验证

- [x] 4.1 `npm run build`
