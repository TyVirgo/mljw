## ADDED Requirements

### Requirement: Retake picker blocks same drop section upfront

重修含退课在「选择课程」弹框中，若某重修行与已选退课行为同一课程代码且同一课程分组，该行 SHALL 不可勾选，且「可选名额/总名额」列 SHALL 显示不能退课后重修相同分组的原因。SHALL NOT 仅在提交申请时才首次提示该限制。

#### Scenario: Same section shows tip in picker

- **WHEN** 学生已选退 ENGL201 分组01，打开重修选课器看到 ENGL201 分组01
- **THEN** 该行禁用，名额列显示同课同分组不可选说明，而非仅显示剩余名额数字

#### Scenario: Different section still selectable

- **WHEN** 已退 ENGL201 分组01，重修选课器中 ENGL201 分组02 有余量且无其它限制
- **THEN** 该行可选，名额列显示剩余/总量
