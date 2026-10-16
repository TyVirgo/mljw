## ADDED Requirements

### Requirement: 申请详情不展示退课通道

加退课申请详情（学生端与审批只读详情共用正文）MUST NOT 在基本信息区展示「退课通道」及其教学周后缀。系统 MAY 仍在数据中保留 `dropChannel` / `teachingWeek` 供业务规则使用。

#### Scenario: 特殊退课详情无通道字段

- **WHEN** 学生打开含 `dropChannel: special` 与 `teachingWeek` 的退课申请详情
- **THEN** 基本信息区不出现「退课通道」标签与「特殊审批 · 第 N 周」类文案

### Requirement: 明细课程类型为统一类别

加退重修申请表单、详情与审批弹窗课程明细表中的「课程类型」列值 MUST 为统一课程类别：必修课、GE01–GE04、ME01–ME04（与 `formatUnifiedCourseCategoryLabel` 一致）。MUST NOT 再展示「公共选修」「专业选修」等旧注册类型长文案作为该列值。缺行内 type/校选时 MUST 回落课库解析。

#### Scenario: ENGL201 显示 GE01

- **WHEN** 详情退课行课号为 ENGL201（课库 GE + arts）
- **THEN** 课程类型列显示 GE01（或等价 locale），MUST NOT 显示「公共选修」
