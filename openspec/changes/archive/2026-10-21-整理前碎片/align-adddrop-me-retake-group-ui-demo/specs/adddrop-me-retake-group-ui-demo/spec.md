## ADDED Requirements

### Requirement: ME ordinary retake picker has no selection-group column or tone

重修专选弹框中，归属「ME选课」虚拟大组的候选 SHALL 不展示课程组列底色；当当前列表仅含 ME选课虚拟组（无 n 选 m）时 SHALL 不展示课程组列。

#### Scenario: Ordinary-only picker
- **WHEN** 学生从 ME选课类挂科原课进入重修选课且候选均属 ME选课虚拟大组
- **THEN** 表头无「课程组」列，行无蓝/黄组底色

### Requirement: N-of-M groups keep column and tone like online ME

4选3 / 3选2 / 2选1 重修候选 SHALL 展示课程组列，并以与在线 ME 一致的交替底色区分组。

#### Scenario: Three-choose-two picker
- **WHEN** 学生从 3选2 挂科原课进入重修选课
- **THEN** 可见课程组列且同组行带组底色

### Requirement: Failed ME original demo covers four categories only

不及格重修专选原课 demo 列表 SHALL 仅覆盖四类各至少一例：4选3、3选2、2选1、ME选课。

#### Scenario: Four rows on ME tab
- **WHEN** 学生选择不及格重修并打开专选原课 Tab
- **THEN** 列表对应四类场景，不堆叠多余同类挂科课
