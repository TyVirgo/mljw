## Why

换组锁原因文案仍写「不可换组重修」，与展示场景不符；原课程表操作列表头与内容同右齐，表头应左齐、链接右齐。

## What Changes

- 将 `coreMustSameSectionReadd`（及弃用键 `coreMustSameSectionRetake` 同步）改为「不符合该分组选课要求」；白名单 tip 不变。
- 原课程表操作列：表头左对齐，单元格（「选择重修课程」）右对齐。

## Non-goals

- 不改换组锁判定逻辑与 tip 文案。

## Capabilities

### New Capabilities

- `adddrop-core-lock-reason-op-align`: 换组锁原因文案与原课程操作列对齐

### Modified Capabilities

- （无）

## Impact

- `src/i18n/locales/zh.js`、`en.js`
- `AddDropApplicationFormSections.vue`（操作列 CSS）
