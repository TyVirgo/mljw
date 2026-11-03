## ADDED Requirements

### Requirement: Primary type shows three compound labels

表单/筛选主类型三选一、学生与审批主表「申请类型」列、以及详情类型标签 SHALL 仅使用以下三描述：加课（退课）、退课、重修（退课）（英文 Add (with drop) / Drop / Retake (with drop)）。内部 type 为 AddDrop / RetakeDrop 时仍映射到对应主描述。SHALL NOT 移除或改动「是否退课」列与字段。

#### Scenario: Form dropdown Add

- **WHEN** 学生打开申请类型下拉
- **THEN** Add 选项文案为「加课（退课）」

#### Scenario: List AddDrop row

- **WHEN** 列表行 type 为 AddDrop
- **THEN** 类型列显示「加课（退课）」，且仍有是否退课列
