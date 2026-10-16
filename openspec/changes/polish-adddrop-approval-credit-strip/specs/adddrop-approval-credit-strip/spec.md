## ADDED Requirements

### Requirement: Approval modal shows live credit strip

单条加退课/重修审批弹框顶部 SHALL 展示与学生申请同源的「学分要求」条。未对任何课行选择「通过」时，SHALL 展示不含本单申请课的学分基线。仅当课行操作为「通过」时，该行 Add/Retake 增加学分、Drop 减少学分。全部课行均通过时，学分条 SHALL 与学生提交时一致。

#### Scenario: Open with no line decisions

- **WHEN** 管理员打开单条审批且行决策均为未选/pending
- **THEN** 顶部学分条为申请前基线（不含本单加/退/重修课）

#### Scenario: Approve one add line

- **WHEN** 管理员将一门加课行设为通过
- **THEN** 学分条在基线上计入该课学分

#### Scenario: All lines approved

- **WHEN** 本单全部课行均为通过
- **THEN** 学分条与申请上保存的提交时学分要求一致（在基线与明细正确的前提下）
