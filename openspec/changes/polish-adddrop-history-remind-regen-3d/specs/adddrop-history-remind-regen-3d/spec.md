## ADDED Requirements

### Requirement: History pending bills can send payment reminder

加退课审批历史 Tab 中，状态为已通过或部分通过且账单为待付款的申请 SHALL 展示「发送邮件提醒」，SHALL NOT 再要求缴费剩余时间不足 24 小时。不足 24 小时或已超时的醒目展示 MAY 仍保留，但与按钮可见性无关。

#### Scenario: Three days remaining still shows remind

- **WHEN** 历史行待缴且缴费剩余约 3 天
- **THEN** 操作列可见「发送邮件提醒」

#### Scenario: Urgent row still shows remind

- **WHEN** 历史行待缴且剩余不足 24 小时或已超时
- **THEN** 仍可见「发送邮件提醒」

### Requirement: Regenerate order defaults to plus three days

「重新生成订单」弹窗打开时，新缴费截止的默认值 SHALL 为当前时刻起算约 3 天；管理员 MAY 修改后再确认。

#### Scenario: Open regen modal

- **WHEN** 管理员对已超时待缴行打开重新生成订单
- **THEN** 新截止预填为约 3 天后的 datetime
