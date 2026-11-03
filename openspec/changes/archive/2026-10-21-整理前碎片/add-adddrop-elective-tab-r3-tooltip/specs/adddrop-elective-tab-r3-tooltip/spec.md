## ADDED Requirements

### Requirement: 加课选修 Tab 第三轮说明 tip

加课选课器「公共选修」「专业选修」Tab MUST 在标签旁展示「？」tooltip，说明选修仅第三轮开放后可选提交、开放前可见但置灰不可操作、必修无此限制。本需求 MUST NOT 改变列表勾选与确认可用性。

#### Scenario: 加课选修 Tab 有 tip

- **WHEN** 学生打开加课选课器
- **THEN** 公共选修与专业选修 Tab 旁可见「？」且悬停可见上述说明，必修课 Tab 无此 tip

#### Scenario: 可选行为不变

- **WHEN** 学生在加课选修 Tab 勾选有余量课程
- **THEN** 勾选与确认行为与加 tip 前一致
