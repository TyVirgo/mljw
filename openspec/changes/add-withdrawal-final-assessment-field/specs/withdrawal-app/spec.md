## ADDED Requirements

### Requirement: 退学申请期末考核确认字段

退学申请表单 SECTION II MUST 包含必填下拉「Will you complete Final Assessment?」，选项为 Yes 与 No。标签旁 MUST 常显提示，英文为：By selecting "Yes", you confirm that you will continue your studies this semester and complete the final assessment. Your official result slip will include this semester's results, and your withdrawal application will only be completed after the results are released.

#### Scenario: 必填校验
- **WHEN** 用户提交退学申请且未选择 Final Assessment
- **THEN** 系统阻止提交并提示该字段必填

#### Scenario: 选 Yes 自动填写出勤日
- **WHEN** 用户将 Final Assessment 选为 Yes
- **THEN** 系统将 Last Date of Attendance 填为本学期 Exam week 最后一天（原型 mock）
- **AND** 用户仍可修改该日期

#### Scenario: 选 No 不锁定日期
- **WHEN** 用户将 Final Assessment 选为 No
- **THEN** Last Date of Attendance 保持可编辑
- **AND** 两字段提示仍显示

### Requirement: 退学 SECTION II 字段顺序与出勤日提示

SECTION II MUST 按以下顺序展示：Current Whereabout 与 Destination after Leaving 同行；Will you complete Final Assessment? 与 Last Date of Attendance 同行；Main Reason for Withdrawal；Detailed Reason。Last Date of Attendance 标签旁 MUST 常显提示：选 Yes 时该日期对应本学期 Exam week 最后一天。

#### Scenario: 布局顺序
- **WHEN** 用户打开退学申请表单 SECTION II
- **THEN** 字段按上述顺序排列

#### Scenario: 详情展示
- **WHEN** 用户查看退学申请详情
- **THEN** 系统展示 Final Assessment 选择结果与 Last Date of Attendance
