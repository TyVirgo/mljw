## Why

申请类型下拉、列表与详情需统一为三描述「加课（退课）/ 退课 / 重修（退课）」；「是否退课」列已存在，仅改文案。

## What Changes

- `primaryOption` 与列表/详情类型标签共用复合三描述
- `type.Add` / `type.Retake` 文案与之对齐（兜底）
- 不改内部 type、不改是否退课字段/列

## Capabilities

### New Capabilities

- `adddrop-primary-compound-labels`: 主类型三描述展示对齐

## Impact

- i18n zh/en；`addDropTypeLabelKey` 指向 `primaryOption`
