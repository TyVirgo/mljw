## ADDED Requirements

### Requirement: R2/R3 capacity columns show available seats

选课结果课程维度第二轮、第三轮 SHALL 将有效最大容量展示为「可选/总量」，将新生容量、老生容量展示为可选剩余名额（容量上限减去本轮已选，下限为 0）。第一轮 MUST NOT 因本需求改变「已选」口径或表头文案。

#### Scenario: Flip enrolled to available on R2

- **WHEN** 某课总量 60、本轮已选 5，新生容量 10 已选 3，老生容量 50 已选 2
- **THEN** 第二轮行显示有效最大 `55/60`、新生可选 `7`、老生可选 `48`

### Requirement: R2/R3 capacity range filters use available

第二/三轮搜索区对有效最大、新生、老生的区间条件 SHALL 按可选剩余人数过滤，标签文案 SHALL 使用「可选」而非「已选」。

#### Scenario: Filter by available senior

- **WHEN** 用户将老生容量可选下限设为 10 并查询
- **THEN** 列表仅保留老生可选 ≥ 10 的课程行
