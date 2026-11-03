## Why

二次申请时学分条已叠真实未审底账，但选课器「是否可选」学期帽与提交校验仍用课表确认态 `enrolled`，出现条上总学分≈6、选课却提示「将达 24」的口径分裂。

## What Changes

- 选课器 `termCreditGate.currentCredits` 与提交前超帽校验改为：课表 enrolled ⊕ 学生真实新提交未审加/退后的净学分（与学分条 pending 底账同源）。
- 表单校验传入的 `currentCredits`（如退至学分下限）同样使用该净学分。
- `dropLines`/`addLines` 仍仅含当前表单行，避免与已计入净学分的 pending 双扣。

## Non-goals

- 不改学分条 / tip 的投影算法（已叠 pending）。
- 不改学期学分上限数值本身。

## Capabilities

### New Capabilities

- `adddrop-picker-gate-pending-ledger`: 选课超帽与提交校验对齐未审底账学分

### Modified Capabilities

- （无）

## Impact

- `StudentAddDropView.vue`（termCreditGate、handleSubmit、validate currentCredits）
- 可选：`addDropMultiItems.js` 抽出 helper（若便于复用）
