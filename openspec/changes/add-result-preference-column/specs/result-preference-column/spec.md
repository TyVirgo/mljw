## ADDED Requirements

### Requirement: Course dimension roster shows course preference before submitted time

课程维度第一轮「志愿结果名单」SHALL 在「志愿提交时间」列之前展示「选课志愿」列；单元格 SHALL 显示「第一志愿」「第二志愿」等可读文案（基于 preferenceRank），不得仅显示纯数字。

#### Scenario: Roster column order

- **WHEN** 管理员打开某分组的第一轮志愿结果名单
- **THEN** 列顺序为 … → 学期 → 选课志愿 → 志愿提交时间 → …

#### Scenario: First preference label

- **WHEN** 名单行 preferenceRank 为 1
- **THEN** 选课志愿显示「第一志愿」（英文对应 First preference 等）

### Requirement: Student dimension preference only for first round source

选课结果·学生维度 SHALL 在「课程来源」与「操作人」之间展示「选课志愿」；仅当课程来源为第一轮选课（preselect）时显示志愿文案，其它来源 SHALL 显示「—」。

#### Scenario: Preselect row has preference

- **WHEN** 学生维行 courseSource 为 preselect 且有 preferenceRank
- **THEN** 选课志愿显示对应「第 N 志愿」文案

#### Scenario: Non-preselect shows dash

- **WHEN** 学生维行 courseSource 为 main / supplement / admin
- **THEN** 选课志愿显示「—」

### Requirement: Exports include course preference

第一轮志愿名单明细导出与选课结果学生维导出 SHALL 包含「选课志愿」字段，文案规则与列表一致。

#### Scenario: Export student and R1 detail

- **WHEN** 管理员导出学生维结果或第一轮志愿明细并勾选该字段
- **THEN** 导出列含选课志愿，第一轮为志愿文案，非第一轮为学生维「—」
