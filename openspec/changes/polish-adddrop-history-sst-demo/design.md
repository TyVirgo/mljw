## Context

学生缴费已拆 `feeAmount`/`sstAmount`/`amount`；管理端 `getApplicationBillDetail` 仅对 `adr-hist-01` 硬编码 SST 行。详情 `lineDecisionLabel` 在终态缺决策时回落「待定」。`typeLabel` 将联合类型映射为 Add/Retake。

## Goals / Non-Goals

**Goals:**

- 有 SST 的申请在账单明细出 SST 行，待缴/已缴合计含税
- 历史详情操作列永不显示「待定」
- 历史可见 AddDrop / RetakeDrop，列表文案用「加课（退课）」「重修（退课）」

**Non-Goals:**

- 不改真实财务接口；不改审批三选项语义（approved / rejected / update_required）

## Decisions

1. `appendSstBillLine(app, lines)`：若 `sstAmount` 或 `feeEstimate.sstAmount` > 0 且行集中尚无 `courseCode===SST`，追加一行；金额取 sst；状态与主待缴/已缴一致。
2. `synthesizeLinesFromApp` 后与 paymentLines 路径均走上述补齐。
3. 历史只读：`lineDecision` 缺省时按申请状态默认（Approved→approved，Rejected→rejected，PartiallyApproved→无决策行视为 approved）；不渲染 pending。
4. `typeLabel`/`typeClass` 直接使用 `AddDrop`/`RetakeDrop`；历史 seed 至少各 1 条含费用的 Approved 联合单。

## Risks / Trade-offs

- 旧硬编码 SST 行与通用补齐可能重复 → 按 `courseCode===SST` + sourceRef 去重。
