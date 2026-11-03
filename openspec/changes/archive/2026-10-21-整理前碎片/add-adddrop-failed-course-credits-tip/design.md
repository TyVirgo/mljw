## Decisions

1. 数据源：`listTranscriptLatestByRetakeType('failed')`，按 CORE/GE/ME 分类求和 `credits`（每课最新一条只计一次）。
2. Tip 挂在 `AddDropTermCreditStrip`，有 strip 即展示（与 situation tip 同门槛），独立第二行。
3. 学分列：`row.credits`，缺省 `—`。
