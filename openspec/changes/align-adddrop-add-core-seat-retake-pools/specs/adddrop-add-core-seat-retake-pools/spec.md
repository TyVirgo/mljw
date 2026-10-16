## ADDED Requirements

### Requirement: Add core hides seat column

加课申请选课器在必修课 Tab SHALL NOT 展示「可选名额/总名额」。重修选课器（提升成绩与不及格重修）在必修课 Tab SHALL 展示该列。

#### Scenario: Add core tab

- **WHEN** 申请类型为加课且选课器在必修课 Tab
- **THEN** 表头不含可选名额/总名额

### Requirement: Retake pools by grade and type

提升成绩 SHALL 仅含最新成绩 ≥60 的课；不及格重修 SHALL 仅含最新 &lt;60 或缺考。必修仅同课全部分组；ME/GE 按课程组/虚拟 GE 组展开。三类 Tab 在 demo 下均 SHALL 有可选课。课表必修不得在无匹配成绩履历时进入池。

#### Scenario: Improve grade core

- **WHEN** 重修类型为提升成绩并打开必修 Tab
- **THEN** 可见至少一门最新分 ≥60 的必修（如 INT300），且不含无及格履历的必修硬塞行

#### Scenario: Failed core

- **WHEN** 重修类型为不及格重修并打开必修 Tab
- **THEN** 可见挂科必修（如 MATH101/PHYS101），不可见仅有及格履历的 INT300
