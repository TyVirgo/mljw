## ADDED Requirements

### Requirement: 学生维度列表去掉是否重修

选课结果「学生维度」表格 MUST NOT 展示「是否重修」列。学生维度导出 MUST NOT 包含是否重修字段。

#### Scenario: 学生维度无是否重修列
- **WHEN** 管理员打开选课结果学生维度
- **THEN** 表头与数据行均不见「是否重修」
