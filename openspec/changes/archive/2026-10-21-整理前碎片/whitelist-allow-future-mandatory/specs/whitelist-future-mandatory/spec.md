## ADDED Requirements

### Requirement: 白名单权限「允许添加未来学期必修课申请」

白名单 MUST 提供权限 `allowFutureMandatory`，界面文案 MUST 为「允许添加未来学期必修课申请」（英对应文案）。新增/编辑白名单表单 MUST 可勾选该权限。

#### Scenario: 新增白名单勾选

- **WHEN** 管理员在新增白名单勾选「允许添加未来学期必修课申请」并保存
- **THEN** 该生白名单 permissions 含 `allowFutureMandatory` 且启用

### Requirement: 加课池纳入未来学期必修

无该有效权限时，加课申请可选课 MUST NOT 包含标记为后续学期的课。有该有效权限时，加课申请可选课 MUST 包含后续学期且为必修的 demo/候选课。

#### Scenario: 无权限看不到未来学期必修

- **WHEN** 学生无 allowFutureMandatory 打开加课选课器必修 Tab
- **THEN** 列表不含 futureSession 必修样例课

#### Scenario: 有权限可加未来学期必修

- **WHEN** 学生有有效 allowFutureMandatory 打开加课选课器必修 Tab
- **THEN** 列表可见 futureSession 必修样例课

### Requirement: 选课器提示例外

加课选课器温馨提示在学生具备该权限时 MUST 说明已允许添加未来学期必修课申请（可与默认规则并列）。

#### Scenario: 有权限时提示

- **WHEN** 有权限的学生打开加课选课器
- **THEN** 可见含「未来学期必修」例外说明的提示
