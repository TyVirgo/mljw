## ADDED Requirements

### Requirement: Credit gap tip under credit requirements strip

加课与加退课申请中，「学分要求」条下方 SHALL 展示学分情况提示（带提示底色）。未修学分 SHALL 由条带毕业 GE/ME 已选与要求差额计算，类型名 SHALL 使用英文 GE、ME。文案 SHALL NOT 引用 programme study plan。

#### Scenario: Missing graduation electives

- **WHEN** 申请类型为加课或加退课，且毕业 GE 或 ME 已选小于要求（如 6/18、11/24）
- **THEN** 条下提示包含未修 GE、ME 学分（如 GE：12学分，ME：13学分）

#### Scenario: All graduation electives met

- **WHEN** 申请类型为加课或加退课，且毕业 GE、ME 已选均不少于要求
- **THEN** 条下提示为均修满学分、无可选课程之意

#### Scenario: Drop or retake hides tip

- **WHEN** 申请类型为退课或重修（含重修关联）
- **THEN** 不展示该学分情况 tip

### Requirement: Tip visible on approval detail

审批/详情中展示学分要求条时，若申请类型为加课或加退课，SHALL 在条下展示与学生端规则一致的学分情况提示。

#### Scenario: Approver sees gap tip

- **WHEN** 审核员打开加课或加退课申请详情且 strip 显示缺学分
- **THEN** 学分要求下方可见未修学分提示
