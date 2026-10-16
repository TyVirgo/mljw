## ADDED Requirements

### Requirement: Add/retake picker CORE seats around five

加课与重修选课器中必修课分组的「可选名额/总名额」SHALL 以约 5 为总名额演示（余量在 0～5）；SHALL NOT 为达成此效果而修改在线选课课库的全局 CORE capacity。

#### Scenario: Core tab seat scale

- **WHEN** 学生在加课或重修选课器打开必修课 Tab
- **THEN** 可见分组名额总量约为 5（如 `3/5`、`5/5`、`0/5`），而非约 40

### Requirement: Retake optional add notes

重修与重修含退课申请表单 SHALL 在费用预估与学生声明之间提供非必填「补充说明」（字段 `addNotes`）。申请/审批详情在存在文案时 SHALL 展示该字段。demo 重修类申请 SHALL 可含样例说明。

#### Scenario: Retake form notes placement

- **WHEN** 学生填写重修申请且已有费用预估
- **THEN** 费用块下方、声明上方可见补充说明输入框且无必填星号

### Requirement: RetakeDrop blocks same course code

重修含退课 SHALL 禁止拟退清单与拟重修清单出现相同课程代码（不论分组）。选课勾选时该重修行 SHALL 禁用，名额列 SHALL 显示原因；提交校验 SHALL 失败。

#### Scenario: Drop and retake INT300 blocked

- **WHEN** 已选退课 INT300，再在重修选课器勾选 INT300 任意分组
- **THEN** 该行不可选且名额列提示不可退后再重修同一门课；若强行提交则校验失败

#### Scenario: Different codes allowed

- **WHEN** 退 HUM110 并重修 INT300
- **THEN** 提交不被同课号规则拒绝
