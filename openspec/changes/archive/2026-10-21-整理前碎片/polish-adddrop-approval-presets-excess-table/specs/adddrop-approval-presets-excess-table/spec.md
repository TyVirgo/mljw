## ADDED Requirements

### Requirement: Common approval comments fully visible

加退课审批弹窗中打开「常用意见」预设列表时，每一条预设文案（含列表顶部第一条）SHALL 完整可见，SHALL NOT 被弹窗滚动容器裁切顶部文字。

#### Scenario: Open presets near comments

- **WHEN** 管理员在审批弹窗点击「常用意见」
- **THEN** 列表中第一条及后续条目的文字均完整可读

### Requirement: Excess credits column label and zero display

加退课审批列表与学生申请列表中，「超出学分」列表头中文 SHALL 为「超出学分」（不含「（分）」）；单元格 SHALL 显示数值，无超出学分数据或纯退课等不适用场景 SHALL 显示 `0`，SHALL NOT 显示「—」。

#### Scenario: Header without unit suffix

- **WHEN** 界面语言为中文且展示超出学分列
- **THEN** 表头文案为「超出学分」

#### Scenario: Missing excess shows zero

- **WHEN** 行无 excessCredits / billableCredits 等可解析数据（或类型为 Drop）
- **THEN** 超出学分列显示 `0`

#### Scenario: Known excess shows number

- **WHEN** 行可解析出超出学分例如 `7`
- **THEN** 超出学分列显示 `7`

### Requirement: Approval history table reduces horizontal scroll

加退课审批历史（及同页 sticky 数据表）SHALL 收紧列间距与最小宽度约束，使常见桌面视口下尽量无需横向滚动即可看完主要列；操作列按钮集合 MAY 在内容过宽时仍局部横滑。

#### Scenario: Typical desktop width

- **WHEN** 管理员在常见桌面宽度打开审批历史 Tab
- **THEN** 表格尽量一屏展示主要字段，不再因固定 1400px 下限强制出现横滑
