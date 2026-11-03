## Why

学分情况 tip 依赖申请类型才出现；tip 必修未修按学期已选对毕业分母算出约 63，偏高；学分条标签 10px 偏小。

## What Changes

- 有学分条即默认展示 tip，不依赖申请类型。
- tip 必修未修按培养方案累计（prior + 条上必修已选）计算，demo 调到约 30。
- 学分条描述字号加大（约 12px），保持单行不换行。

## Non-goals

- 不改学分条两行数值口径（毕业必修格仍可与学期同源展示）。

## Capabilities

### New Capabilities

- `adddrop-credit-tip-default-label-size`: tip 默认 + 必修约 30 + 标签字号

### Modified Capabilities

- （无）

## Impact

- `AddDropTermCreditStrip.vue` / `addDropMultiItems.js` / `studentRegistrationContext.js`
