## ADDED Requirements

### Requirement: 结果页老生容量弹窗展示使用口径

当用户在选课结果 ME 批课程维点击老生容量时，系统 MUST 打开只读弹窗，按 meQuota 各层次展示：配置名额、已分配人数、剩余可选人数；MUST NOT 以设置侧「占比% + 名额数」编辑器形态作为主展示。

#### Scenario: 打开使用弹窗

- **WHEN** 用户点击 ME 批某课的老生容量（或老生容量可选）数字
- **THEN** 弹窗列出各层次的配置名额、已分配、剩余可选，并显示合计

#### Scenario: 剩余计算

- **WHEN** 某层次配置名额为 N、已分配为 A
- **THEN** 该层剩余可选为 max(0, N − A)

### Requirement: 归集规则

已分配 MUST 来自当前轮次占用名额名单（不含特殊新加）：入学学期落在该层次 intakes 的老生计入该层；未匹配任何 intake 层次的老生 MUST 计入特殊学生行（若存在）。

#### Scenario: 按入学学期归层

- **WHEN** 名单中有老生 intake 为 2024/09，且存在 intakes 含 2024/09 的层次行
- **THEN** 该生计入该层次已分配
