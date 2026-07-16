## MODIFIED Requirements

### Requirement: 各类型 Section V 声明条款

异动申请表单与详情视图 MUST 在 Section V 按类型显示编号的声明条款。所有异动类型 MUST 在通用正确性条款之后包含家长/监护人申请结果邮件通知告知条款（中英文）。

#### Scenario: 退学显示两条通用条款
- **WHEN** 用户查看退学 Section V
- **THEN** 第一条声明申请信息正确且完整
- **AND** 第二条声明家长/监护人将通过电子邮件获知申请结果

#### Scenario: 休学与复学在通用两条之后含最长修业年限
- **WHEN** 用户查看休学或复学 Section V
- **THEN** 前两条为通用正确性声明与家长邮件通知告知
- **AND** 其后为最长修业年限确认

#### Scenario: 转专业在通用两条之后含专有条款
- **WHEN** 用户查看转专业 Section V
- **THEN** 前两条为通用正确性声明与家长邮件通知告知
- **AND** 其后依次为规则承诺及签证注销确认

#### Scenario: 中英文文案
- **WHEN** 界面语言为英文
- **THEN** 家长通知条款展示为 `I acknowledge that my parent(s)/guardian(s) will be notified of the application result by email.`
- **WHEN** 界面语言为中文
- **THEN** 家长通知条款展示为 `我知悉，家长/监护人将通过电子邮件获知本申请结果。`
