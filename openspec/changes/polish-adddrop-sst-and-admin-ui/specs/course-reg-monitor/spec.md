## ADDED Requirements

### Requirement: 监控搜索区去掉仅异常学生

学生选课监控搜索区 MUST NOT 展示「仅异常学生」复选框。通过统计卡片筛选异常时仍可使用内部 `problemsOnly` 过滤。

#### Scenario: 搜索区无仅异常学生
- **WHEN** 管理员打开学生选课监控
- **THEN** 搜索行不见「仅异常学生」勾选
