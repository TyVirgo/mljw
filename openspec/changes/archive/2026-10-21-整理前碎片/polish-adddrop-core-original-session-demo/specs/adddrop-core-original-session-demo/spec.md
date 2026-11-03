## ADDED Requirements

### Requirement: Add core tab shows original class session column

加课（含加退关联加课侧）选课弹框在「必修课」Tab SHALL 在「可选名额/总名额」列之前展示「原上课学期」列。单元格值 SHALL 为学年学期格式（如 `2026/04`）。公选/专选 Tab MUST NOT 因此新增该列。

#### Scenario: Original session before seats

- **WHEN** 学生打开加课选课弹框并停留在必修课 Tab
- **THEN** 表头在名额列前可见「原上课学期」
- **AND** 加课必修候选行展示如 `2026/04` 的原上课学期

#### Scenario: Non-core tabs omit column

- **WHEN** 学生切换到公共选修或专业选修 Tab
- **THEN** 不见「原上课学期」列

### Requirement: Add core demo courses differ from drop core

演示数据中，加课资格池的必修课 SHALL NOT 与退课池课表必修（`DEMO_REQUIRED_COURSES`）为同一门课。学生在加退场景下打开加课必修 Tab 时，加课必修行 SHALL 默认可选（不因与退课必修同课同分组出现禁选提示）。

#### Scenario: Add core selectable after drop other core

- **WHEN** 学生已选退课 MATH101 分组01，再打开加课必修 Tab
- **THEN** 加课必修列表不含 MATH101
- **AND** 所列必修课分组均可按名额/冲突等常规规则选择，不出现「不能退课后加回同一门课的相同课程分组」

#### Scenario: Same-section rule still applies for true overlap

- **WHEN** 学生退某课分组并加回该课相同分组（真实同课同组）
- **THEN** 该加课行仍不可选并提示同课同分组原因
