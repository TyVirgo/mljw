## ADDED Requirements

### Requirement: 审批历史账单明细含 SST

当申请存在 SST（`sstAmount` 或 `feeEstimate.sstAmount` > 0）时，账单明细 SHALL 在课程费行之外展示 SST 行，且待缴/已缴合计 SHALL 含 SST。

#### Scenario: 国际生待缴含税

- **WHEN** 审批历史打开账单明细且申请 SST 为 66、课程费合计 1100
- **THEN** 明细含课程行与 SST 行，待缴合计为 1166

### Requirement: 历史详情操作无待定

历史/只读申请详情的课程「操作」列 SHALL 仅展示通过、不通过或驳回；SHALL NOT 展示「待定」。

#### Scenario: 已通过退课缺行决策

- **WHEN** 打开已通过纯退课申请详情且退课行无 `lineDecision`
- **THEN** 操作列显示「已通过」（或等价通过文案），不显示「待定」

### Requirement: 历史联合类型可见

审批历史列表 SHALL 展示 AddDrop、RetakeDrop 类型标签（加课（退课）/ 重修（退课）），且 demo 数据 SHALL 包含此类历史记录。

#### Scenario: 列表含加退与重修退

- **WHEN** 用户打开审批历史 Tab
- **THEN** 可见至少一条 AddDrop 与一条 RetakeDrop 记录，类型标签不为折叠后的纯「加课」「重修」
