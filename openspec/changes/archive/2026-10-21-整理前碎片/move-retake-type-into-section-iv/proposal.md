## Why

合一单后「重修类型」仍挂在申请信息公共区，和 SECTION IV 重修内容脱节，应放进重修节第一行。

## What Changes

- 从申请信息区移除「重修类型」下拉。
- 在 `SECTION IV : Course Retake（重修）` 内作为第一行展示（仍必填，逻辑不变）。

## Non-goals

- 不改重修类型选项、选课校验与 `retakeType` 字段语义。

## Capabilities

### New Capabilities

- `adddrop-retake-type-in-section-iv`: 重修类型移入 SECTION IV 首行

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`
