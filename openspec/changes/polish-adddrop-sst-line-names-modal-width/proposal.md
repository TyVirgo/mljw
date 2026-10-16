## Why

费用预估 SST 行带多余 `+`；加课/重修短字段「预估费用 / SST」顺序与期望相反；详情重修节与「费用预估」节重复展示费用与 SST，且费用节缺少表单同款计算明细。

## What Changes

- 费用预估列表 SST 行改为 `SST: {amount}`（如 `0 RMB`），去掉前缀 `+`
- 申请表单加课节、重修节：SST 与「预估费用」短字段位置互换
- 详情（申请/审批共用）：重修节去掉预估费用与 SST；保留「费用预估」节，并展示与表单一致的课程行明细 + SST + 合计
- 详情「费用预估」节在详细说明下方恢复三字段：预估费用、SST、合计费用（顺序同旧版；盒内明细保留）
- 详情加课节去掉预估费用与 SST（与重修节一致），费用仅保留在「费用预估」节；申请/审批同步
- 补全 `feeStream.aiOpen` 等 i18n，避免明细露出 key
- （既有）Demo 课名与课库对齐；审批宽窗 / 操作列保底（已完成部分保留）

## Capabilities

### New Capabilities

- `adddrop-sst-line-names-modal-width`: SST 行文案、费用字段布局、详情费用明细、课名统一、审批窗宽

## Impact

- `AddDropApplicationFormSections`、`AddDropApplicationDetailBody`、i18n zh/en
- （既有）selectableCourses、studentDemoSeed、addDropApprovalQueue、AddDropApprovalModal
