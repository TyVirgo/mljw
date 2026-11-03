## ADDED Requirements

### Requirement: Retake original table centered alignment

重修原课程表表头与单元格内容 SHALL 水平居中对齐。

#### Scenario: Centered cells
- **WHEN** 用户查看原课程表
- **THEN** 各列表头与单元格均为水平居中

### Requirement: Failed retake blocks passed mates in same selection group

在不及格重修选课弹框中，与原课同一课程组（含 4选3 / 3选2 / 2选1 / ME选课虚拟大组）的候选课，若该课最新成绩已及格（≥60），则该课全部教学班 SHALL 不可选，并提示「该课程已有成绩且及格」。原挂科课与组内未修课 SHALL 仍可选。

#### Scenario: Three-choose-two with one passed mate
- **WHEN** 学生从挂科 SE201 进入重修选课，且同组 AI110 最新成绩及格、WEB220 无成绩
- **THEN** AI110 全部分组不可选并提示已有成绩且及格；SE201 与 WEB220 各分组可选

### Requirement: ME ordinary virtual group and demo coverage

未归属 n 选 m 的 ME 课 SHALL 归入「ME选课」虚拟大组并支持组内互替重修；demo 成绩单与开课 SHALL 使原课列表在专选 Tab 下能覆盖 4选3、3选2、2选1 与 ME选课场景，且弹框内同组候选行足够演示互替。

#### Scenario: ME ordinary mutual retake
- **WHEN** 学生从未入 n 选 m 的挂科 ME 课进入重修选课
- **THEN** 弹框展示同属 ME选课虚拟大组的其他本学期开课，并可互相选择（已及格课除外）
