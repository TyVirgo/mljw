## ADDED Requirements

### Requirement: 学分情况 tip 文案

加课/加退学分条下方未修说明 MUST 为：「根据programme study plan，目前毕业累计未修学分为：必修课：{mandatory}学分；GE：{ge}学分，ME：{me}学分；」（英文等价、无第二人称 you/your）。

#### Scenario: tip 无「你」

- **WHEN** 学分条展示未修 tip
- **THEN** 文案含「目前毕业累计未修学分为」且不含「你目前毕业累计未修学分」

### Requirement: 必修选课列为是否可选且不拦名额

加课（含加退加课侧）与重修选课弹窗在「必修课」Tab MUST 展示「是否可选」列，MUST NOT 展示「可选名额/总名额」。可选行 MUST 显示绿色「是」；不可选行 MUST 显示具体原因（换组锁、冲突、超学分、同课已选组等）。学生端 MUST NOT 因该必修分组名额已满而禁用或提示已满。公选/专选 Tab MUST 仍展示名额列并可因满员不可选。审批界面 MUST 仍可展示名额。

#### Scenario: 必修满员仍可选

- **WHEN** 学生加课必修 Tab 某分组 remainingCapacity 为 0，且无其它不可选原因
- **THEN** 「是否可选」为「是」且可勾选

#### Scenario: 换组锁仍不可选

- **WHEN** 必修异组触发换组锁
- **THEN** 「是否可选」显示不可换组短原因且不可勾选
