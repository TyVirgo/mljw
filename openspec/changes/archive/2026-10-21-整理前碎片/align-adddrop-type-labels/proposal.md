## Why

学生申请列表/详情仍把 AddDrop/RetakeDrop 折叠成加课/重修，且无色标；表单主类型三字与审批侧期望的「加课（退课）、退课、重修（退课）」不一致。

## What Changes

- 列表与详情按真实 type 五分展示文案+色标（与审批对齐）
- 表单/筛选主类型三选一使用独立 `primaryOption` 文案：加课（退课）/退课/重修（退课）
- 抽取共用 type 展示 helper，避免两端再分叉

## Capabilities

### New Capabilities

- `adddrop-type-label-align`: 申请/审批类型标签与主类型选项对齐

## Impact

- `StudentAddDropView`、`AddDropApprovalView`、`AddDropApplicationDetailBody`、`AddDropApplicationFormSections`、`AddDropApprovalModal`
- i18n zh/en
