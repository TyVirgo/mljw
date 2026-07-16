## Context

上一版允许多监护人可编辑快照并支持增删。产品现要求：申请内仅展示学生信息页带出的数据。

已确认：
- 教师代填、学生自填无监护人时均禁止提交
- tip 放在 SECTION III 标题旁（与 section-bar 同行）

## Goals / Non-Goals

**Goals:**
- 只读、无增删、标题 tip、空档案拦截提交

**Non-Goals:**
- 跳转学生档案深链；转专业/复学引入 Section III

## Decisions

1. **UI**：`MovementParentConsentSection` 增加 `readOnly`（或默认只读），输入 `readonly`，去掉垃圾桶与添加按钮；空列表提示改为「请先在学生个人信息页维护至少一位家长/监护人」。

2. **标题 tip**：因 `section-bar` 在各 FormModal 内渲染，于休学/退学两处标题旁加 `field-hint-tip-wrap`（与 deferment period tip 同款）；文案 i18n 共用键如 `movementCommon.parentConsent.fromProfileHint`。

3. **校验**：沿用 `validateParentContacts`「至少 1 个」；教师与学生同一提交路径，无需分流。

4. **快照**：选学生仍写 `parentContacts`；打开学生端从当前学生 family 带出；申请内不再 `@update:contacts` 因增删。只读可不 emit。

## Risks / Trade-offs

- [Risk] 编辑草稿时档案已变更 → Mitigation：原型以打开/选学生时快照为准；与声明一致「改档案后再申请」

## Open Questions

（已关闭）
