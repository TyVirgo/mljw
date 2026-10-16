## ADDED Requirements

### Requirement: 缴费行展示课程费与 SST

待缴费/待支付列表行 SHALL 展示课程费（学分×单价）、SST 与应付金额；右侧金额 SHALL 为含税应付。

#### Scenario: 国际生有费用

- **WHEN** 行课程费为 1650 且按 China/International 计税
- **THEN** SST 为 99，应付为 1749，且文案可区分三项

### Requirement: 结算明细含 SST

结算明细 SHALL 分别展示课程费合计、SST 合计与应付合计；勾选合计与下单金额 SHALL 为含税应付之和。

#### Scenario: 勾选两门含税课

- **WHEN** 学生勾选两门 SST>0 的待缴费课并查看结算
- **THEN** SST 合计为两行 sstAmount 之和，应付合计为两行 amount 之和
