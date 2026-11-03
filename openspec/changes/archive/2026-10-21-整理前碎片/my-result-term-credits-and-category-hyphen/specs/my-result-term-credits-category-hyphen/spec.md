## ADDED Requirements

### Requirement: 我的课程展示本学期累计学分

「我的课程」页在「我的课表」按钮旁 MUST 展示「本学期累计学分：{n}分」（英文等价）。{n} MUST 为本学期全部已选课程学分之和（含必修与选修），MUST NOT 随列表 Tab 或搜索条件变化。本学期 MUST 以当前活动批次学年学期判定。

#### Scenario: 工具条学分和

- **WHEN** 学生打开我的课程且本学期已选学分合计为 11
- **THEN** 可见「本学期累计学分：11分」

### Requirement: 统一课程类别展示带连字符

凡经 `formatUnifiedCourseCategoryLabel`（及 FromLine）展示的 GE/ME 统一类别 MUST 为 GE-01…GE-04、ME-01…ME-04。必修课文案不变。筛选选项展示 MUST 同步；内部筛选码 MAY 仍为 GE01。

#### Scenario: 我的课程列展示

- **WHEN** 列表行统一类别为 GE02
- **THEN** 单元格显示 GE-02，MUST NOT 显示 GE02
