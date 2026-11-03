## ADDED Requirements

### Requirement: Drop credit strip is one row four columns

退课总学分、退课必修课、退课专业选修、退课公共选修四个只读字段 SHALL 以单行四列展示。

#### Scenario: Drop credits layout
- **WHEN** 申请表退课区已有退课行并显示学分汇总
- **THEN** 四个学分字段在同一行四列排列

### Requirement: Retake original list title follows retake type with required mark

原课程区标题 SHALL 随 `retakeType` 变化，且两侧均带必填星号：不及格为「不及格课程 *」；提升成绩为「允许重修课程 *」。

#### Scenario: Failed type title
- **WHEN** 重修类型为不及格
- **THEN** 原课程区标题为不及格课程并显示必填星

#### Scenario: Improve grade type title
- **WHEN** 重修类型为提升成绩
- **THEN** 原课程区标题为允许重修课程并显示必填星

### Requirement: Original list shows course type and merged session-grade history

原课程表 SHALL 在课程代码前列展示课程类型；SHALL 将学年学期与原成绩合并为「学年学期/成绩」列；一门课可多行成绩（`学年学期：成绩`，最新在上）。池归属 SHALL 以最新成绩判定：分数 ≥60（含 60）属提升池，否则属不及格池。操作列 SHALL 完整可见「选择重修课程」。

#### Scenario: Multi-session grades newest first
- **WHEN** 某课成绩单有多条学年学期记录
- **THEN** 「学年学期/成绩」列自上而下按学期新到旧展示多行

#### Scenario: Pool by latest score
- **WHEN** 最新成绩分数为 60 或以上
- **THEN** 该课仅出现在提升成绩重修类型的原课程列表

#### Scenario: Course type column first
- **WHEN** 原课程表有数据行
- **THEN** 首列为课程类型

### Requirement: Retake type dropdown filters fail or improve pool only

选择一种重修类型后，原课程列表 SHALL 仅展示该池课程；外层必修/公选/专选 Tab SHALL 在此基础上再过滤，切换外层 Tab 才调整列表中的课程类别数据。

#### Scenario: Dropdown shows one pool
- **WHEN** 用户选择不及格重修类型
- **THEN** 原课程列表仅含最新成绩属不及格池的课程

#### Scenario: Outer tab filters category
- **WHEN** 用户在原课程区切换到公共选修 Tab
- **THEN** 列表仅展示公共选修类原课（仍受当前重修类型池约束）

### Requirement: Retake picker hides course-type tabs; add picker unchanged

重修选课弹框 SHALL 不展示必修/公选/专选 Tab，并按所选自原课的课程类型自动展示对应候选列表。加课选课弹框的类别 Tab 行为 SHALL 保持不变。

#### Scenario: Retake picker no tabs
- **WHEN** 用户从原课程行进入重修选课弹框
- **THEN** 弹框不显示类别 Tab，且候选列表限定为该原课允许的重修课程（含类型锁定）

#### Scenario: Add picker tabs remain
- **WHEN** 用户打开加课选课弹框
- **THEN** 仍显示必修/公选/专选类别 Tab
