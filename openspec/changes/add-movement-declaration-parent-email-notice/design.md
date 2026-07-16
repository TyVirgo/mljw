## Context

Section V 已由 `movementDeclarationItems.js` 按类型输出 i18n key 列表，再由 `MovementDeclarationSection` 渲染。四类均含 `movementCommon.declaration.correct`（【通用】）。

产品图示要求在该通用句后追加家长邮件通知告知，且标注为【通用】全部申请。

## Goals / Non-Goals

**Goals:**
- 一处定义、四类复用
- 中英文齐备；条款编号自动随数组长度变化

**Non-Goals:**
- 邮件发送、家长联系人数据联动
- PDF/导出模板专项改造（若导出走同一 items，会自然带上；不做单独验证任务）

## Decisions

1. **新通用 key：`movementCommon.declaration.parentEmailNotice`**  
   放入 `commonDeclarationItems`，并让四类数组都以 `[...commonDeclarationItems, …特有条款]` 或在各数组中于 `COMMON_CORRECT` 后插入同一常量。  
   推荐：抽出 `commonDeclarationItems = [CORRECT, PARENT_EMAIL]`，四类以此为前缀，避免漏改某一类。

2. **插入位置**  
   紧接 correct 之后、类型特有条款之前（与图示「通用」语义一致）。

3. **中文文案**  
   `我知悉，家长/监护人将通过电子邮件获知本申请结果。`（与现有「我知悉…」语气对齐）

## Risks / Trade-offs

- [Risk] 历史截图与导出 PDF 若硬编码旧条款 → Mitigation：原型以页面 Section V 为准；导出若另有硬编码另开任务

## Open Questions

（无）
