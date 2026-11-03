## ADDED Requirements

### Requirement: Original retake table column order and actions alignment

重修原课程表列顺序 SHALL 为：课程代码、课程名称、学年学期/成绩、课程类型、操作。操作列表头与单元格 SHALL 右对齐。

#### Scenario: Column order
- **WHEN** 用户查看原课程表表头
- **THEN** 「课程类型」位于「操作」前一列，且「课程代码」为第一列

#### Scenario: Actions right-aligned
- **WHEN** 原课程表有数据行
- **THEN** 「选择重修课程」链接在操作列内右对齐
