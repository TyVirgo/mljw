## ADDED Requirements

### Requirement: Fee estimate SST line without plus

加课/重修费用预估列表 SHALL 始终包含 SST 行；金额文案 SHALL 为 `SST: {amount}`（如 `SST: 0 RMB`），SHALL NOT 在金额前使用 `+` 前缀。

#### Scenario: Local student zero SST

- **WHEN** sstAmount 为 0 且有课程费用行
- **THEN** 费用预估中可见 `SST: 0 RMB`（或等价本地化金额）与合计，且无 `+` 号

### Requirement: Form short fields SST before fee estimate

申请表单加课节与重修节中，SST 短字段 SHALL 出现在「预估费用」短字段之前（互换原顺序）。

#### Scenario: Retake form field order

- **WHEN** 学生打开重修申请表单且已选课
- **THEN** 分区内可见顺序为重修总学分 → SST → 预估费用（或同区 2×2 下 SST 在预估费用之前）

### Requirement: Detail retake and add omit duplicate fee fields

申请/审批详情的重修节与加课节 SHALL NOT 再展示「预估费用」与「SST」；这两项及计算明细 SHALL 仅出现在「费用预估」节。

#### Scenario: Retake detail no duplicate fee

- **WHEN** 打开含重修与应付费用的申请详情
- **THEN** 重修节仅保留重修类型、重修总学分等业务字段
- **AND** 「费用预估」节展示课程计费行、SST 行与合计，口径与申请表单费用预估盒一致
- **AND** 明细盒下方另有预估费用、SST、合计费用三字段（顺序为此）

#### Scenario: Add detail no duplicate fee

- **WHEN** 打开含加课与应付费用的申请详情
- **THEN** 加课节不展示预估费用与 SST，仅保留学分相关字段
- **AND** 费用仍仅在「费用预估」节展示

### Requirement: Same course code same display language

审批课程汇总中同一 courseCode 的课名 SHALL 随界面语言一致（课库 name/nameZh），不得同表中英混用。

#### Scenario: AI110 in zh UI

- **WHEN** 界面为中文且课库有 nameZh
- **THEN** AI110 各行均显示「人工智能导论」

### Requirement: Approval modal shows decision column

含课程汇总的审批弹窗 SHALL 足够宽，使操作列（通过/不通过/驳回）可见。

#### Scenario: Wide approval open

- **WHEN** 打开含多行课程的审批弹窗
- **THEN** 操作列完整可见（或可横滚看到）
