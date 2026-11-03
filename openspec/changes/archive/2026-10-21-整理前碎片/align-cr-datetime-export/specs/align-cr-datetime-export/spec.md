## ADDED Requirements

### Requirement: 缴费名单导出按钮样式

缴费名单管理页「导出」按钮 MUST 使用与选课过程其它列表一致的 outline 样式，并 MUST 左对齐于工具栏。

#### Scenario: 打开缴费名单

- **WHEN** 管理员打开缴费名单管理
- **THEN** 「导出」为蓝边 outline 按钮且位于表格上方左侧

### Requirement: 审批提交时间到秒

加退课/重修审批列表的「提交时间」MUST 展示为 `YYYY-MM-DD HH:mm:ss`；若源数据缺秒 MUST 补齐为 `:00`。

#### Scenario: 历史列表提交时间

- **WHEN** 管理员查看审批历史列表
- **THEN** 每行提交时间均含时分秒三段

### Requirement: 白名单添加时间到秒

白名单「添加白名单时间」MUST 与审批提交时间相同格式（`YYYY-MM-DD HH:mm:ss`）。

#### Scenario: 白名单列表时间

- **WHEN** 管理员查看白名单列表
- **THEN** 「添加白名单时间」列为带秒的日期时间，而非仅日期
