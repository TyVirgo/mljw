## Context

现网 `layoutGeRound1Roster`：毕业生可占满容量；非毕业生分日超额则随机且落选当日出局；无志愿序。业务要求 90% 封顶、志愿序、跨日回补。

## Goals / Non-Goals

**Goals:**

- `graduateCapRatio` 可配（默认 0.9），挂 `round1Quota`
- GE 分配：毕业生封顶 → 分日额度 → 当日志愿序优先 → 余量回补 waitlist → 额度结转
- 志愿带 `preferenceRank`；demo 可演示

**Non-Goals:** ME 抽签；学生端志愿排序 UI；校级 CR 新条目

## Decisions

### 1. 90% 配置位置

- **选择**：`round1Quota.graduateCapRatio`（0–1），与 `decayR` 同级；批次抽屉可编辑（百分比展示）。
- **备选**：校级 registrationRules — 本变更不做，默认写在 normalize 默认值即可。

### 2. 余量优先级

- **选择**：当日申请人先分配 → 余量回补 waitlist → 仍剩余则 **结转** 次日。
- 与业务示例（D2/D3 当日全上再补往日）一致。

### 3. 志愿序

- 字段 `preferenceRank`（正整数，越小越优先）；缺省视为较低优先（如 99）以免误伤有序数据。
- Demo 种子约 2/3 为 1、1/3 为 2。

### 4. 毕业生封顶计算

```
gradCap = floor(capacity * graduateCapRatio)
selectedGrads = |grads| <= gradCap ? all : random(gradCap)
remaining = capacity - |selectedGrads|
```

## Risks / Trade-offs

- [Risk] 旧「当日出局」心理模型变化 → 结果页选上名单会变；提示文案可后续改
- [Trade-off] 缺 preferenceRank 时几乎同志愿档 → 退化为随机（可接受）

## Migration Plan

纯前端；刷新种子即用新算法。无持久化迁移。

## Open Questions

无（已用推荐默认：round1Quota、先回补再结转、preferenceRank 字段）。
