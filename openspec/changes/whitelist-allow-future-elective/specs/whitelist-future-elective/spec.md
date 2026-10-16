## ADDED Requirements

### Requirement: Whitelist permission for future-term electives

白名单 MUST 提供权限 `allowFutureElective`，界面文案 MUST 为「允许添加未来学期选修课申请」。勾选后 MUST 要求填写 GE 学分与 ME 学分（各 ≥1），并 MUST 至少选择一类 ME 课程组类别（沿用现有类别：课程4选3 / 课程3选2 / 课程2选1 / 普通）。GE MUST NOT 要求选择课程组（符合学生选课范围的 GE 视为一大组）。未勾选时 MUST NOT 要求上述字段。「允许添加未来学期必修课申请」MUST 保持独立、不受本权限替代。

#### Scenario: Create with elective permission

- **WHEN** 管理员勾选「允许添加未来学期选修课申请」并填写 GE=3、ME=6、勾选课程2选1 后保存
- **THEN** 该生 permissions 含 `allowFutureElective`，且 geCredits=3、meCredits=6、meCategoryKeys 含 group2of1

#### Scenario: Missing credits blocked

- **WHEN** 勾选该权限但未填 GE 或 ME 学分后保存
- **THEN** 保存失败并提示必填

#### Scenario: Missing ME category blocked

- **WHEN** 勾选该权限且学分已填但未选任何 ME 课程组类别后保存
- **THEN** 保存失败并提示须选择 ME 类别

### Requirement: Add pool includes future electives when permitted

无有效 `allowFutureElective` 时，加课申请可选课 MUST NOT 包含标记为后续学期的选修课。有有效权限时，加课申请可选课 MUST 可包含后续学期 GE（符合该生校选范围）以及后续学期 ME（其课程组类别落在白名单所选 meCategoryKeys 内）。

#### Scenario: Without permission no future elective

- **WHEN** 学生无 allowFutureElective 打开加课选课器
- **THEN** 列表不含 futureSession 的 GE/ME 样例

#### Scenario: With permission sees matching future elective

- **WHEN** 学生有 allowFutureElective（含对应 ME 类别）打开加课选课器
- **THEN** 可见匹配的 futureSession 选修样例课
