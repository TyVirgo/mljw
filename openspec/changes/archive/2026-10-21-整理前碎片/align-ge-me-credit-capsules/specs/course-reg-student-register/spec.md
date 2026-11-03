## ADDED Requirements

### Requirement: GE 学分短标签为 GE01–GE04
在线选课入口卡与列表学分胶囊中，GE 类别短标签 MUST 分别为 GE01、GE02、GE03、GE04（对应文/商/理/AI与开放选修），MUST NOT 再使用「文」「商」「理」「AI与开放选修」作为短标签。

#### Scenario: 入口卡可见 GE01–GE04
- **WHEN** 学生打开在线选课入口且存在 GE 卡片
- **THEN** GE 毕业与本学期学分明细胶囊标签为 GE01–GE04

### Requirement: 入口卡毕业与学期学分胶囊列对齐
入口卡内「毕业学分」与「本学期学分」两行的总分及各类别胶囊 MUST 在同一列网格中上下对齐。

#### Scenario: GE/ME 卡片列对齐
- **WHEN** 学生查看公共选修或专业选修入口卡
- **THEN** 毕业行与学期行对应类别胶囊左右起点一致
