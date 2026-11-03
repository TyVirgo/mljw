## Why

申请类型组合展示用 `+`，需改为 `/`；demo 未覆盖「加+重修」「退+加+重修」；二次提交仍只认学生新提交。

## What Changes

- 列表/详情/审批类型文案：`退课/加课/重修`，用 `/` 拼接。
- demo 种子补齐单/双/三类型全部组合；重种条件纳入新 type。
- 二次禁交/底账继续仅 `adr-stu-*`，demo 不计入。

## Non-goals

- 不改三是否表单交互。

## Capabilities

### New Capabilities

- `adddrop-type-slash-demo-coverage`: `/` 类型文案 + demo 七组合

### Modified Capabilities

- （无）

## Impact

- `addDropTypeDisplay.js` / i18n / `studentDemoSeed.js`
