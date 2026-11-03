## ADDED Requirements

### Requirement: Score unit suffix

曾修成绩百分制展示 SHALL 在数字后加「分」（如 `45分`）。缺考文案 SHALL NOT 加「分」。

#### Scenario: History line

- **WHEN** 成绩为 45 分、学期 2025/04
- **THEN** 显示 `2025/04 45分`

### Requirement: Retake core tab shows seat column

重修选课器（提升成绩与不及格重修）在必修课 Tab SHALL 展示「可选名额/总名额」列。可选时显示剩余/总额；不可选时单元格 SHALL 显示原因（如冲突、已满、超学分），与公选/专选口径一致。

#### Scenario: Core tab seat column visible

- **WHEN** 打开重修选课器并停留在必修课 Tab
- **THEN** 表头含可选名额/总名额，且行内有余量或不可选原因
