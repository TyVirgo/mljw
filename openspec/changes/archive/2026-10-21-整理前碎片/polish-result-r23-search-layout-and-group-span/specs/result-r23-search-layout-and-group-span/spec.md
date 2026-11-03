## ADDED Requirements

### Requirement: Course-dimension search uses inline label layout

选课结果课程维搜索区 SHALL 将标签与输入控件排在同一行；容量区间条件 SHALL 为「标签 + 最小值 + 至 + 最大值」横向排列，不得将标签单独占满一行置于控件上方。

#### Scenario: Expanded R2 search shows inline ranges

- **WHEN** 用户展开第二轮搜索区
- **THEN** 「有效最大容量已选」等区间标签与最小/最大输入框处于同一水平行

### Requirement: ME selection group is first content column with rowspan

ME 批次第二/三轮结果表 SHALL 将「课程组」列置于勾选列之后、序号之前；同一课程组的连续课程行 SHALL 合并课程组单元格；无课程组的行各自显示「—」。

#### Scenario: Same group merges

- **WHEN** 连续多门课属于同一 selectionGroup
- **THEN** 课程组列仅在首行渲染并跨行合并，组名与须选说明不重复出现在每一行
