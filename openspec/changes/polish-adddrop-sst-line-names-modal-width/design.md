## Decisions

1. **SST 行文案**：始终展示；金额为 0 时写 `SST: 0 RMB`，**不**加前缀 `+`。
2. **短字段顺序**：加课 / 重修分区内 DOM 顺序改为先 SST、后「预估费用」（2 列 grid 自然换位）。短字段金额口径仍为既有 `payableTotal`（本变更不改计费公式）。
3. **详情去重**：从**重修节与加课节**均移除预估费用 / SST；加课节仅保留总学分 / 学期超出 / 毕业超出（计费）等学分字段。费用统一落在「费用预估」节。
4. **详情费用节**：上为表单同款明细盒（`items` + SST 行无 `+` + 盒内合计）；下为字段网格恢复旧版三格：**预估费用**（`feeEstimate.total`）→ **SST** → **合计费用**（payableTotal）。盒内说明与下方字段数字可重复，属有意双呈现。`合计费用` 用独立 i18n key，盒内「合计」仍用 `feeEstimateTotal`。
5. **`resolveCourseDisplayName`**：课库 `nameZh`/`name`；demo 存英文 `courseName`（既有）。
6. **审批窗**：`--wide` → `min(1320px, 98vw)`；操作列保底（既有，可被后续列宽 polish 覆盖）。
7. **i18n**：`feeStream.aiOpen` 中/英补全。
