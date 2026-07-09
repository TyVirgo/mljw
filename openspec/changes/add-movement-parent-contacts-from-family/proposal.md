# 休学/退学 Section III 多家长监护人联系人

## 背景
学生档案 `family[]` 可含多位家长/监护人，但休学与退学申请 Section III 仅回显并保存单一联系人，与业务不符。

## 变更内容
- 选学生时从 `student.family[]` 映射全部非空联系人为 `parentContacts[]` 快照
- 表单内可编辑各联系人字段，不回写学生档案（无增删按钮，视觉与原先单联系人表单一致）
- 休学：每条非空联系人姓名 + 联系电话必填
- 退学：每条非空联系人五项全必填
- 详情展示全部联系人
- **UI 保持与原 Section III 一致**：沿用原有 `form-grid` / `detail-grid` 字段布局，按联系人数重复整块，不引入卡片、折叠、增删按钮等新样式
- 兼容旧 flat 字段（`parentGuardianName` 等）→ `parentContacts[0]`

## 影响
- `movementParentContacts.js` — 映射、归一化、校验、legacy 同步
- `MovementParentConsentSection.vue` / `MovementParentConsentReadonly.vue`
- `DefermentFormModal.vue` / `WithdrawalFormModal.vue`
- `deferments.js` / `withdrawals.js`
- `DefermentDetailModal.vue` / `WithdrawalDetailModal.vue` / `MovementDetailContent.vue`
