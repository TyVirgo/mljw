## ADDED Requirements

### Requirement: R2/R3 hide section column and use one row per course

选课结果第二轮、第三轮课程维 SHALL 一门课一行，且 MUST NOT 展示「课程分组」列；搜索区 MUST NOT 提供课程分组条件。

#### Scenario: R2 table has no section column

- **WHEN** 用户打开课程维度第二轮
- **THEN** 表头不含「课程分组」，且同一课程不因多个教学班出现多行

### Requirement: ME selection group demo and column

ME 结果批次 SHALL 配置至少三组课程组（4选3、3选2、2选1），课程组列 SHALL 展示组名（及入学范围/须选说明）；GE 批次 MUST NOT 展示课程组列。

#### Scenario: CHS ME shows non-dash groups

- **WHEN** 用户选择 CHS ME 结果 demo 批次并查看第二轮
- **THEN** 至少部分课程的课程组列显示 Group 文案而非「—」

### Requirement: Search by selection group and capacity ranges

课程维搜索（R2/R3，ME 时含课程组条件）SHALL 支持按课程组关键字过滤；SHALL 对有效最大容量已选、新生容量已选、老生容量已选、特殊新加学生数量各提供最小值与最大值区间过滤（空端表示不限）。有效最大容量区间 MUST 作用于已选分子。

#### Scenario: Filter senior enrolled range

- **WHEN** 用户将老生容量已选下限设为 2、上限设为 5 并查询
- **THEN** 列表仅保留该轮老生已选人数在 [2,5] 内的课程行
