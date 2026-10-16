## ADDED Requirements

### Requirement: 我的课程仅三分类型 Tab

「我的课程」类型筛选 MUST 仅提供全部、选修课、必修课；MUST NOT 再提供「申请和添加课程」独立 Tab。申请加课/重修与管理员代选 MUST 按课程性质归入必修或选修。

#### Scenario: Tab 仅三项

- **WHEN** 学生打开我的课程
- **THEN** 可见全部、选修课、必修课
- **AND** 不可见「申请和添加课程」Tab

#### Scenario: 申请课归入选修或必修

- **WHEN** 已批准加课为 ME/GE 类课程
- **THEN** 该课出现在「选修课」筛选结果中
- **WHEN** 已批准加课为必修类课程
- **THEN** 该课出现在「必修课」筛选结果中

### Requirement: 我的课表两色图例

「我的课表」MUST 仅用必修课与选修课两色区分有排课课程；图例与说明 MUST NOT 再出现「申请和添加课程」色块。

#### Scenario: 图例两色

- **WHEN** 学生打开我的课表预览
- **THEN** 图例仅含必修课与选修课

### Requirement: 演示课表无同时段冲突

演示数据中，同一学生「我的课表」内有上课时间的课程 MUST NOT 在相同星期相同时刻重叠；申请课时段 SHOULD 对齐课库可选分组。

#### Scenario: SE201 / CST201 与 COMP3192 不重叠

- **WHEN** 演示生同时拥有 SE201、CST201 与已批 COMP3192
- **THEN** COMP3192 上课时段不与 SE201、CST201 或其他已选有时段课程重叠
