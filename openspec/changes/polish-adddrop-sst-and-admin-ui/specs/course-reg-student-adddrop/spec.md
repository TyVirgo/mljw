## ADDED Requirements

### Requirement: 详情是否退课只展示结果文本

加退课/重修申请详情（学生端与审批共用 `AddDropApplicationDetailBody`）中「是否需要退课」MUST 以文本展示「是」或「否」，MUST NOT 使用单选控件（含 disabled radio）。

#### Scenario: 重修关联显示是
- **WHEN** 申请类型为重修含退课且 needDrop=yes
- **THEN** 基本信息区「是否需要退课」值为「是」
- **AND** 不见 radio 选项

### Requirement: 详情退课分节字段一行两列

退课 SECTION 表格下方的退课总学分、退课专业选修、退课公共选修、退课原因、附件 MUST 使用两列网格排布，MUST NOT 强制整行占满（`field-item--full`）。

#### Scenario: 退课汇总两列
- **WHEN** 详情展示含退课学分汇总与退课原因
- **THEN** 字段按两列排列（如总学分|专选，公选|原因）
