## ADDED Requirements

### Requirement: 选课时间可按启用筛选

选课时间列表 SHALL 支持按学年学期与是否开启过滤。

#### Scenario: 仅看停用

- **WHEN** 用户选择「停用」并查询
- **THEN** 列表仅含未开启的学期配置

### Requirement: 选课批次类型与专业筛

选课批次 SHALL 支持按类型筛选，并可通过收起区按所属专业模糊筛选。

#### Scenario: 筛 GE

- **WHEN** 用户选择类型为公共选修并查询
- **THEN** 列表仅含 GE 批次

### Requirement: 选课结果课程维扩充与收放

课程维度搜索 SHALL 支持课程类型，并在收起区提供分组与学分条件；条件过多时 SHALL 提供收放且流式换行。

#### Scenario: 展开后筛分组

- **WHEN** 用户展开搜索并输入分组关键字查询
- **THEN** 仅保留分组匹配的课程行
