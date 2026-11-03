## ADDED Requirements

### Requirement: Demo 确认课不含管理员代选

加退学生端 demo 确认课 MUST NOT 包含管理员代选 BUS201；学分条学期已选总 MUST 为 29（GE6+ME14+必修9），GE 学期已选 MUST 为 6。

#### Scenario: 打开退课表单学分条

- **WHEN** 学生打开退课申请且未勾选拟退
- **THEN** 学期已选总学分为 29，且退课可选列表中无 BUS201 代选行

### Requirement: 总学分格与同行同色

学分条「学期已选总学分」MUST 使用学期行橙底；「毕业已选总学分」MUST 使用毕业行蓝底；MUST NOT 使用独立青绿覆盖。

#### Scenario: 总学分格色随行

- **WHEN** 学生查看两行学分条
- **THEN** 右侧两格分别与左侧学期行、毕业行底色一致

### Requirement: 退课选择说明含原来与还剩

退课选课弹窗在已勾选时 MUST 显示：已选择 {count} 门课程，退课合计学分{drop}分，原来合计学分{original}分，还剩合计学分{remain}分。{original} MUST 为基线学期已选总学分；{remain} MUST 为 original − drop（不小于 0）。

#### Scenario: 勾选一门后退课说明

- **WHEN** 基线学期已选总为 29 且勾选合计 4 学分的 1 门课
- **THEN** 选择说明含退课合计 4、原来合计 29、还剩合计 25
