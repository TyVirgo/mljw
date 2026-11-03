## Why

学生在线选课（R1）搜索区「课程已选百分比」选项仍为「有余量/已满」，过滤按席位满员，与表格列展示的志愿百分比不一致，查询结果不可信。

## What Changes

- R1：筛选项改为「全部 / < 100% / ≥ 100%」，按与列一致的 `志愿数/容量` 真实过滤**分组行**。
- R2/R3：仍用「有余量/已满」+ 现有席位逻辑，不改语义。
- 补充 zh/en 文案。

## Non-goals

- 不改表格列展示公式、胶囊配色或志愿提交逻辑。
- 不改其它搜索字段（课程代码、学分等）。

## Capabilities

### New Capabilities

- `student-register-capacity-pct-filter`: R1 按已选百分比筛分组行；R2/R3 保留名额状态筛

### Modified Capabilities

- （无）

## Impact

- `StudentRegisterView.vue`、`sectionTableRowSpans.js`（或同行过滤辅助）、zh/en i18n
