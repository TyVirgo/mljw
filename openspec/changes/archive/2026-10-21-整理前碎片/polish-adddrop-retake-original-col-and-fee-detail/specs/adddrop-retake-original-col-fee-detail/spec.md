## ADDED Requirements

### Requirement: Selected retake table shows original failed course

申请表「选择的重修课程」汇总表 SHALL 使用该标题（不再使用「本学期重修课程」），并以「重修原课程」列展示该行对应不及格原课的 `课程代码/课程名称`，不得在该列展示曾修成绩文本。

#### Scenario: Original column format
- **WHEN** 用户已选择一门对应原课 MATH101 / Calculus I 的重修课
- **THEN** 「重修原课程」列显示 `MATH101/Calculus I`

#### Scenario: Title wording
- **WHEN** 用户查看重修汇总表
- **THEN** 表字段标签为「选择的重修课程」

### Requirement: Fee estimate shows per-line billing process

费用预估块的加课费用、重修费用 SHALL 在存在对应 `feeEstimate.items` 时展开逐课计费过程（课号 · 科类 · 应收学分 × 单价 = 金额）；无对应行时该项显示 `0 RMB`。SST 有税额时 SHALL 展示课程费合计 × 税率公式，税额为 0 时显示 `0 RMB`。

#### Scenario: Retake fee detail lines
- **WHEN** 费用预估含多条重修计费行
- **THEN** 「重修费用」下可见每条课的计费过程文案，合计仍为各行之和

#### Scenario: Zero add fee
- **WHEN** 无加课毕业超出计费行
- **THEN** 「加课费用」显示 `0 RMB` 且无逐课过程行
