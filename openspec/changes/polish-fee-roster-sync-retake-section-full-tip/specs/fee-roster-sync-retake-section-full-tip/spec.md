## ADDED Requirements

### Requirement: Fee roster reflects approval and payment

审批通过并生成待缴账单时，缴费名单 SHALL 写入对应课程未缴明细。学生在课程缴费完成支付后，缴费名单中对应课程行 SHALL 变为已缴（是否缴费等汇总随之变化）。既有 demo 种子行 SHALL 保留。

#### Scenario: After approval unpaid

- **WHEN** 管理员批准当前生有费用申请
- **THEN** 缴费名单可查看该生含该课的未缴明细

#### Scenario: After student pays

- **WHEN** 学生在课程缴费完成该申请相关课的支付
- **THEN** 缴费名单对应课行显示为已缴费

### Requirement: RetakeDrop blocks only same course same section

重修含退课 SHALL 允许退一门课并重修同课的其他分组；SHALL 禁止退修同一课程的相同分组。选课器名额列 SHALL 提示原因；提交校验 SHALL 失败。SHALL NOT 仅因课号相同而拒绝不同分组。

#### Scenario: Different section allowed

- **WHEN** 退 MATH101 分组01，重修 MATH101 分组02
- **THEN** 可选且提交不被同课规则拒绝

#### Scenario: Same section blocked

- **WHEN** 退 MATH101 分组01，勾选重修 MATH101 分组01
- **THEN** 名额列提示不可选且提交失败

### Requirement: Full seat tip is specific

当教学分组名额已满时，「可选名额/总名额」SHALL 显示含剩余与总量的具体说明（并含不能选择语义），SHALL NOT 仅显示「已满」。

#### Scenario: Full row label

- **WHEN** 某行 remaining 为 0 且有总量
- **THEN** 名额列文案类似「该教学分组名额已满（0/40），不能选择」
