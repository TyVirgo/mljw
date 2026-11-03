## ADDED Requirements

### Requirement: All-courses schedule uses four-color type layers

在「我的选课」处于「全部课程结果」时，打开「我的课表」MUST 包含有上课时间的多类型结果；课表块 MUST 按必修、选修、申请、管理员四色着色；MUST 展示对应四项图例。

#### Scenario: Open schedule on all tab

- **WHEN** 学生在「全部课程结果」Tab 打开我的课表预览
- **THEN** 课表含多类型有时段课程，图例含必修/选修/申请/管理员，副标题说明四色含义

### Requirement: Typed tab schedule keeps type filter hint

在非「全部」类型 Tab 打开课表时，副标题 MUST 说明按当前类型过滤；该 Tab 内课程仍按其 `resultType` 对应颜色着色。

#### Scenario: Open schedule on application tab

- **WHEN** 学生在「申请」Tab 打开我的课表预览
- **THEN** 仅展示申请类型有时段课程，且块使用申请色
