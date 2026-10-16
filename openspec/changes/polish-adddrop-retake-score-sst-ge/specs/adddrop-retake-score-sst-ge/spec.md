## ADDED Requirements

### Requirement: Previous grades show numeric scores

曾修学期/成绩、原成绩及选课器曾修列 SHALL 展示 0–100 分数（非及格/不及格文案）。得分低于 60 视为不及格（用于重修类型分流）。缺考无分时可显示「缺考」。

#### Scenario: Fail score in history

- **WHEN** 成绩单行为 score=45、session=2025/04
- **THEN** 曾修列显示「2025/04 45」

### Requirement: Estimated fee includes SST

表单与详情中「预估费用」短字段 SHALL 等于课程费用合计加 SST（payableTotal）。SST 字段仍单独展示。

#### Scenario: International with SST

- **WHEN** 课程费 3600、SST 216
- **THEN** 预估费用显示含税合计 3816（或等价 RMB 文案）

### Requirement: Retake table shows course type

重修课程表 SHALL 在上课时间地点与曾修成绩之间展示课程类型列。

#### Scenario: GE retake row

- **WHEN** 重修行为 GE 课
- **THEN** 课程类型列显示公共选修（或项目既有 GE 文案）

### Requirement: Failed retake GE picker has courses

不及格重修选课器在公共选修 Tab SHALL 至少有一门可选 GE（demo 成绩单含 GE 挂科且挂本学期开课）。

#### Scenario: Open GE tab for failed retake

- **WHEN** 申请类型为重修且重修原因为不及格，打开选课器公共选修 Tab
- **THEN** 列表非空
