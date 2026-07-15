# 休学/退学 Section III 多家长监护人联系人

## 背景
学生档案 `family[]` 可含多位家长/监护人，但休学与退学申请 Section III 仅回显并保存单一联系人，与业务不符。填写人还需能自行增减联系人数量（含删至 0 后再手动添加）。

## 变更内容
- 选学生时从 `student.family[]` 映射全部非空联系人为 `parentContacts[]` 快照
- 表单内可编辑各联系人字段，不回写学生档案
- **可增删联系人**：每条标题栏右侧显示垃圾桶图标（含仅 1 条时也可删）；可删至 0；底部提供「添加家长/监护人」按钮手动追加空白块
- 空态：无联系人块，仅保留添加入口与列表级校验提示
- 休学：每条非空联系人姓名 + 联系电话必填；提交时至少一条有效联系人
- 退学：每条非空联系人五项全必填；提交时至少一条有效联系人
- 详情只读展示全部联系人（无增删控件）
- 多位联系人：编号标记 + 分割线；有联系人时均显示「Parent/Guardian N」标题行以便放置删除按钮
- 兼容旧 flat 字段（`parentGuardianName` 等）→ `parentContacts[0]`

## 非目标
- 不回写学生档案 `family[]`
- 不修改只读详情为可编辑
- 删除不二次确认弹窗

## 影响
- `movementParentContacts.js` — 映射、归一化、校验、legacy 同步
- `MovementParentConsentSection.vue` — 增删 UI 与 `update:contacts`
- `MovementParentConsentReadonly.vue`
- `DefermentFormModal.vue` / `WithdrawalFormModal.vue`
- `deferments.js` / `withdrawals.js`
- `DefermentDetailModal.vue` / `WithdrawalDetailModal.vue` / `MovementDetailContent.vue`
- i18n（`zh-flat.js` 等）
