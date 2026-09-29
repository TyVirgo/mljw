## ADDED Requirements

### Requirement: 加课/重修展示 SST 并计入应付总额

加课与重修（含关联退课）申请表在学分费用汇总区 MUST 展示只读「SST」字段。预估费用 MUST 仍为超出学分费用（不含税）。当学生类别为非本地（China 或 International）且预估费用 > 0 时，SST MUST 等于预估费用 × 6%（四舍五入为整数 RMB）；否则 SST MUST 为 0。提交账单金额 MUST 为预估费用 + SST。详情 MUST 同步展示 SST。

#### Scenario: 本地生 SST 为 0
- **WHEN** 本地生加课/重修产生预估费用 > 0
- **THEN** SST 显示 0
- **AND** 账单金额等于预估费用

#### Scenario: 国际生加收 SST
- **WHEN** International 或 China 学生预估费用为 1000
- **THEN** SST 为 60
- **AND** 账单金额为 1060

#### Scenario: 无超额费用
- **WHEN** 预估费用为 0
- **THEN** SST 为 0
