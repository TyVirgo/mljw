## ADDED Requirements

### Requirement: 详情加课/重修补充说明常显

申请与审批详情中，当展示加课 SECTION 时 MUST 始终展示「加课补充说明」字段；当展示重修 SECTION 时 MUST 始终展示「重修补充说明」字段。值为空时 MUST 显示 `—`，MUST NOT 因空而隐藏整行。

#### Scenario: 空说明仍可见标签

- **WHEN** 打开含加课且无 addNotes 的申请详情
- **THEN** 加课区可见「加课补充说明」且值为 `—`

### Requirement: 详情重修表同时展示曾修课程与曾修成绩

申请与审批详情重修课表 MUST 展示「曾修课程」列（格式 `课程代码/课程名称`）以及「曾修课程成绩」列。列标题 MUST 为「曾修课程」（MUST NOT 使用「重修原课程」）。单元格 MUST 尽量完整展示，MUST NOT 以省略号截断为主要展示方式（允许换行）。

#### Scenario: 曾修课程列完整可见

- **WHEN** 详情含重修行且原课为 MATH101 / Calculus I
- **THEN** 「曾修课程」显示完整 `MATH101/Calculus I`（或等价换行完整展示）

### Requirement: 同课退+重修合法（含同组）

联合申请中，拟退与拟重修 MAY 为同一课程代码，且 MAY 为同一课程分组。审批 demo MUST NOT 将同课号多行视为数据错误而删除。（同课同组提交拦截已由后续变更 `allow-adddrop-retake-same-section-after-drop` 取消。）

#### Scenario: 同课异组可提交

- **WHEN** 退 MATH101 分组01 且重修 MATH101 分组02
- **THEN** 校验通过

#### Scenario: 同课同组可提交

- **WHEN** 退 MATH101 分组01 且重修 MATH101 分组01
- **THEN** 校验通过（不因同课同组阻断）
