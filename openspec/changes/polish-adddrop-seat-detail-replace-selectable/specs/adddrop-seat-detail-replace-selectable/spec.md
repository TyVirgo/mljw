## ADDED Requirements

### Requirement: Seat column on all add/retake picker tabs

加课（含加退关联加课）与重修「选择课程」表 SHALL 在各课程类型 Tab（含必修）展示「可选名额/总名额」。退课选课器 SHALL NOT 展示该列。表 SHALL NOT 再展示「是否可选」列。

#### Scenario: Add core tab shows seats

- **WHEN** 申请类型为加课且选课器在必修课 Tab
- **THEN** 表头含「可选名额/总名额」，且不含「是否可选」

#### Scenario: Retake mirrors add

- **WHEN** 学生打开重修选课弹框任意类型 Tab
- **THEN** 可见「可选名额/总名额」，不可见「是否可选」

### Requirement: Seat cell shows detailed block reasons

当行不可勾选时，「可选名额/总名额」单元格 SHALL 显示完整原因文案（时间冲突含冲突课程与时段、学期/GE 学分超限含将达与上限数值、已满、同课其他分组已选、与拟退同课同分组等），SHALL NOT 仅显示「时间冲突」「超出学期学分，不能选择」等短标签。可选且有余量时 SHALL 显示 `剩余/总量`。

#### Scenario: Schedule conflict detail

- **WHEN** 某行因与已选/在读课时间冲突而禁用
- **THEN** 名额列展示含对方课码与时段的冲突说明，而非仅「时间冲突」

#### Scenario: Credit cap detail

- **WHEN** 勾选该行将超过学期或 GE 学分上限
- **THEN** 名额列展示含将达学分与上限的说明
