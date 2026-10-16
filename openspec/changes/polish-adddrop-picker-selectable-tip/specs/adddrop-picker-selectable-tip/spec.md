## ADDED Requirements

### Requirement: Add/retake picker shows selectable column

加课（含加退关联）与重修「选择课程」表 SHALL 展示「是否可选」列。可选行 SHALL 显示「是」（或等价英文）；不可选行 SHALL 显示具体原因（时间冲突、已满、超出学期学分、与拟退课同课同分组等），SHALL NOT 仅靠行置灰而无文案。

#### Scenario: Core add tab shows reason

- **WHEN** 学生在加课选课器「必修课」Tab 看到因时间冲突而不可勾选的行
- **THEN** 「是否可选」列显示冲突相关原因文案

#### Scenario: Elective keeps seat column

- **WHEN** 学生在加课「专业选修」Tab 查看列表
- **THEN** 同时可见「是否可选」与「可选名额/总名额」列

### Requirement: Retake picker shows substitute tip

重修「选择课程」弹框顶部 SHALL 展示温馨提示，说明必修仅同课重修、公共选修可在虚拟课程组内替代、专业选修可在同课程组内替代；版式 SHALL 与加课 eligibility tip 同类。

#### Scenario: Open retake picker

- **WHEN** 学生打开重修选课弹框
- **THEN** 顶部可见重修替换规则说明 Callout
