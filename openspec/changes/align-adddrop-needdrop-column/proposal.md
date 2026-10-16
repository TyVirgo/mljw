## Why

列表曾用五分类型文案（加课（退课）/重修（退课）），与表单主类型三选一及「是否退课」语义重叠，阅读成本高。需统一为「主类型三字 + 是否退课列」。

## What Changes

- 学生端/审批端列表：申请类型仅展示主类型（加课/退课/重修）
- 新增列「是否退课」：AddDrop/RetakeDrop/Drop → 是；Add/Retake → 否
- 学生列表列序：类型 → 是否退课 → 状态；审批列表：类型后紧跟是否退课
- 详情：类型主三字；纯退课亦展示是否退课=是
- 表单/筛选 `primaryOption` 文案恢复为加课/退课/重修（不再带「（退课）」）

## Capabilities

### New Capabilities

- `adddrop-needdrop-column`: 列表/详情主类型三字展示与是否退课列

### Modified Capabilities

- （无主规格增量外变更）

## Impact

- `addDropTypeDisplay.js`、`addDropListColumns.js`、`addDropFormSections.js`（Drop→needDrop yes）
- `StudentAddDropView`、`AddDropApprovalView`、`AddDropApplicationDetailBody`
- i18n `primaryOption` / 列表列头
