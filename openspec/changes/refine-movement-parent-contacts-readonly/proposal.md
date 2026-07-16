## Why

休学/退学 Section III 监护人信息应作为学生档案只读带出：申请内不可改、不可增删；档案无监护人时（含教师代填）禁止提交。需在 SECTION III 标题旁用 tip 说明该规则。

## What Changes

- Section III 监护人字段全部只读（展示自 `student.family[]` 快照）
- 移除删除按钮、「添加家长/监护人」及空态「点击添加」引导
- 无有效监护人时，学生端与教师代填均禁止提交（至少 1 条）
- SECTION III 标题旁增加 `?` tip：数据来自学生个人信息页，申请内不可修改，有误请去档案维护

## Non-goals

- 不改学生档案 Family 页本身
- 不把监护人区扩展到转专业/复学
- 不改详情只读展示结构（详情本已只读）

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `movement-parent-contacts`：由可编辑可增删改为档案只读带出；标题 tip；空档案禁止提交

## Impact

- `MovementParentConsentSection.vue`（只读 + 去增删）
- `DefermentFormModal.vue` / `WithdrawalFormModal.vue`（SECTION III 标题旁 tip）
- i18n tip / 空态文案
- `validateParentContacts` 已含「至少 1 个」，必要时强化空态错误提示
