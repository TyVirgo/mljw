## Why

加退课「学分要求」七卡单行难扫读；需学期/毕业分行，总学分右侧跨两行，并补齐毕业选修/必修已选两格。

## What Changes

- 学分条改为两行：上行学期（GE/ME 学期 + 学期选修/必修，橙底）；下行毕业（GE/ME 毕业 + 毕业选修/必修已选，现有蓝底）。
- 「已选总学分」右侧跨两行一列（仍为学期选修+学期必修之和）。
- 新增展示「毕业选修已选学分」「毕业必修已选学分」；strip 暴露 `gradElective`，启用已有 `gradMandatory` 展示。

## Non-goals

- 不改学分投影/缴费算法。
- 不改学分情况 tip 口径。

## Capabilities

### New Capabilities

- `adddrop-credit-strip-two-row`: 学分条两行布局

### Modified Capabilities

- （无）

## Impact

- `AddDropTermCreditStrip.vue`
- `addDropMultiItems.js`（gradElective）
- i18n zh/en
