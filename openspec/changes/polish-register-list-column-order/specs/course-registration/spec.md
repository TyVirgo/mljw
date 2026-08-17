## ADDED Requirements

### Requirement: 在线选课主表列序与校选类别

学生在线选课（GE / ME）主表 MUST 使用相同列序：课程名称后为课程分组；校选类别在学分之前；容量（已选/容量或志愿数量/课程容量）紧挨操作列之前。GE 与 ME MUST 均展示校选类别（文科 / 商科 / 理科）。ME demo 数据 MUST 呈现同一校选类别；GE demo MUST 允许混杂。

#### Scenario: 分组紧跟课程名称
- **WHEN** 学生打开 GE 或 ME 选课列表
- **THEN** 「课程分组」列位于「课程名称」之后

#### Scenario: 容量在操作前
- **WHEN** 学生查看含操作列的选课列表
- **THEN** 容量列紧挨「操作」列之前

#### Scenario: GE 展示混杂校选
- **WHEN** 学生在 GE 批次查看课程列表
- **THEN** 可见「校选类别」列且可出现文/商/理不同值

#### Scenario: ME 校选同一类
- **WHEN** 学生在 ME 批次查看课程列表
- **THEN** 列表中各课「校选类别」为同一类（demo 为文科）
