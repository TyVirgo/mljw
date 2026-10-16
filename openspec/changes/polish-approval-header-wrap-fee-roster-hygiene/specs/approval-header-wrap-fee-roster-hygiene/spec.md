## ADDED Requirements

### Requirement: Approval table headers wrap at most two readable lines

加退课审批 sticky 数据表表头 SHALL NOT 以单汉字竖排展示；紧凑列（如是否退课、超出学分、发送邮件次数）SHALL 具备合理最小宽度，表头换行最多约两行且保持可读。

#### Scenario: Compact Chinese headers

- **WHEN** 管理员打开审批历史表且视口为常见桌面宽度
- **THEN** 「是否退课」「超出学分」「发送邮件次数」等表头不以一字一行呈现，至多约两行完整可读

### Requirement: Fee roster rows have identity fields

缴费名单由学生缴费/审批待缴同步写入时，行 SHALL 携带或回填学生姓名，并尽量补全专业与入学批次；聚合列表 SHALL NOT 展示姓名为空的行。

#### Scenario: Sync from unpaid approval lines

- **WHEN** 审批待缴课行同步进入缴费名单
- **THEN** 对应明细含非空 `studentName`（来自申请或同学生已有行/档案回填）

#### Scenario: Incomplete identity hidden from aggregate

- **WHEN** 明细行学号存在但姓名为空
- **THEN** 学生聚合列表不展示该脏行
