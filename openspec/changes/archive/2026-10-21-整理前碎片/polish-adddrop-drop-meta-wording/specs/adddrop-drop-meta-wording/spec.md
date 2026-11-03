## ADDED Requirements

### Requirement: 退课选择说明语序

退课选课弹窗已勾选时 MUST 显示：「已选择 {count} 门课程，退课前学分合计{original}分，退课学分合计{credits}分，还剩学分合计{remain}分」（或英文等价）；数值口径 MUST 与既有基线学期总 / 勾选合计 / 差值一致。

#### Scenario: 勾选一门

- **WHEN** 基线学期总 29、勾选合计 4 学分的 1 门课
- **THEN** 选择说明为含「退课前学分合计29分，退课学分合计4分，还剩学分合计25分」的完整句
