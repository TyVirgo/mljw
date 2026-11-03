## ADDED Requirements

### Requirement: Credit situation tip under credit strip

加退课申请及加课/退课/重修选课弹框在「学分要求」条下方，SHALL 展示学分情况提示（带提示底色）。未修学分 SHALL 按当前学分要求条数据汇总（要求 − 已选），并随勾选选课动态更新。文案 SHALL 使用固定提示语，其中 `programme study plan` 保持英文。

#### Scenario: Deficit tip for AddDrop

- **WHEN** 类型为加退课且毕业 GE/ME/必修存在未修学分
- **THEN** 显示「根据programme study plan，你目前毕业累计未修学分：必修课：{m}学分；GE：{ge}学分，ME：{me}学分；」

#### Scenario: Full tip for Add

- **WHEN** 类型为加课且三类未修均为 0
- **THEN** 显示「根据programme study plan，你目前均修满学分，无可选课程。」

#### Scenario: Picker tip follows selection

- **WHEN** 学生在加课或退课或重修选课弹框勾选课程导致学分条数字变化
- **THEN** 条下 tip 的未修学分数字与当前条一致更新
- **AND** tip 固定句式文案不变（仅数字变化）

#### Scenario: RetakeDrop picker shows credit strip and tip

- **WHEN** 学生打开重修关联退课（RetakeDrop）选课弹框且有学分条基线
- **THEN** 弹框展示学分要求条及条下学分情况 tip

#### Scenario: Detail shares tip

- **WHEN** 审批或申请详情展示学分要求条
- **THEN** 条下可见与申请侧规则一致的学分情况提示
