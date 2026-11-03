## ADDED Requirements

### Requirement: Payment remind count starts at zero

加退课审批通过（含部分通过）并生成待缴账单时，历史列表「发送邮件次数」SHALL 默认为 0。仅当管理员成功发送「发送邮件提醒」后 SHALL 递增 1。

#### Scenario: Fresh approval

- **WHEN** 管理员批准有费用申请并进入历史 Tab
- **THEN** 该行发送邮件次数为 0 次

#### Scenario: After remind click

- **WHEN** 管理员对该待缴行发送邮件提醒一次
- **THEN** 发送邮件次数变为 1 次

### Requirement: Approved unpaid courses sync to student payment

学生「课程缴费」待缴费 SHALL 保留既有 demo 待缴行，并 SHALL 追加当前学生在审批队列中状态为已通过或部分通过、账单待付款、有应付金额的课程行。审批通过写账单后及再次进入课程缴费页时 SHALL 能看到新增行，MUST NOT 仅依赖首次页面灌种。

#### Scenario: Approve then open payment

- **WHEN** 管理员为当前演示生批准有费用申请后，学生打开课程缴费待缴费
- **THEN** 列表在原有 demo 行之外可见该申请对应的待缴费课程行
