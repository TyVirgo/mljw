# 变更：refine-ge-r1-day-backfill-and-grad-cap

## Why

GE 第一轮现网「毕业生可占满容量 + 落选当日出局 + 无志愿序」与业务不一致：需毕业生最多占约 90%（留 10% 给其他学生）、分日内按第一/第二志愿优先再随机，以及后续天余量可回补往日落选。

## What Changes

- **毕业生封顶比** `graduateCapRatio`（默认 **0.9**）：写入 `round1Quota`（与 `decayR` 同级），批次轮次管理可配置；**BREAKING** 相对旧逻辑（毕业生可 100% 占满）。
- **重写 GE `layoutGeRound1Roster`**：
  - 毕业生优先但不超过 `floor(capacity × ratio)`；
  - 非毕业生按衰退因子分日额度；
  - 当日优先按志愿序分层随机；余量从 waitlist 回补（往后日看，往日落选可补回）；未用额度结转次日；
  - 志愿序字段 `preferenceRank`（1=第一志愿，2=第二志愿…）。
- Demo 种子为志愿补 `preferenceRank`；抽签调用传入 `graduateCapRatio`。

## Non-goals

- 不改 ME 第一轮入学年池逻辑
- 不改学生端志愿提交 UI（仅数据字段与抽签）
- 不把 90% 做成独立校级 CR 规则条目（本变更用 round1Quota；校级默认可后续再挂）

## Capabilities

### New Capabilities

- `ge-r1-allocation`：GE 第一轮毕业生封顶、分日额度、志愿序与跨日回补分配规则

### Modified Capabilities

- （无主库已归档条目；以本 change 规格为准。）

## Impact

- `preselectWeightedLottery.js`（`layoutGeRound1Roster`）
- `batchRound1Quota.js`（`graduateCapRatio` 归一化）
- `BatchRoundManageDrawer.vue` + i18n（配置项）
- `preselectVolunteerConfirm.js`（种子 `preferenceRank`、传参）
