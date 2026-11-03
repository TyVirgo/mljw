## ADDED Requirements

### Requirement: 列表与详情五分类型标签

申请列表与审批列表、以及双方详情中的申请类型 SHALL 按真实 type 展示五分文案（加课 / 退课 / 重修 / 加课（退课） / 重修（退课））及对应色标；SHALL NOT 将 AddDrop/RetakeDrop 折叠为加课/重修。

#### Scenario: 联合加退详情

- **WHEN** 打开 type=AddDrop 的申请或审批详情
- **THEN** 申请类型显示「加课（退课）」且带联合类型色标样式

### Requirement: 主类型三选一文案

申请表单与申请/审批筛选中的主类型选项 SHALL 显示为「加课（退课）」「退课」「重修（退课）」（或等价英译文案）。

#### Scenario: 新建申请选类型

- **WHEN** 学生打开申请表单申请类型下拉
- **THEN** 选项文案为加课（退课）、退课、重修（退课），内部值仍为 Add/Drop/Retake
