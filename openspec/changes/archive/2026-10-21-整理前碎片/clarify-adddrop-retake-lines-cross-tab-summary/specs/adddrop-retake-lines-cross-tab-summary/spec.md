## ADDED Requirements

### Requirement: Retake summary aggregates all tab selections

本学期重修课程表、重修总学分（计费）、重修预估费用与费用预估明细 SHALL 汇总必修/公选/专选各类原课所选出的本学期重修课（非原课列表本身）；切换 Tab 或为另一原课再选 SHALL 不清除其它原课已确认的重修行。

#### Scenario: Select retake under two categories
- **WHEN** 用户在公选原课确认一门重修课后，再在必修原课确认另一门重修课
- **THEN** 本学期重修课程表同时包含两门课，学分与费用按两门合计

#### Scenario: Reselect for same original
- **WHEN** 用户对同一原课再次打开选课并确认新教学班
- **THEN** 该原课对应的旧重修行被新选择替换，其它原课的重修行仍保留

### Requirement: Summary copy describes selected retake courses

汇总区说明文案 SHALL 表明展示与计费对象为各类已选本学期重修课。

#### Scenario: Hint text
- **WHEN** 用户查看本学期重修课程区
- **THEN** 可见提示表明此处汇总各类型原课对应选出的重修课
