## ADDED Requirements

### Requirement: 我的课程类型 Tab

「我的课程」页 SHALL 提供四个类型 Tab：全部课程、选修课、必修课、其他课程。SHALL NOT 再单独展示「申请」「管理员添加」Tab。

#### Scenario: 查看类型 Tab

- **WHEN** 学生打开「我的课程」
- **THEN** 可见全部课程、选修课、必修课、其他课程四个 Tab

### Requirement: 其他课程合并过滤

「其他课程」Tab SHALL 列出 `resultType` 为申请类或管理员代选类的已选课程（二者并集）。

#### Scenario: 切换到其他课程

- **WHEN** 学生选择「其他课程」
- **THEN** 列表仅含申请来源与管理员添加来源的课程行

### Requirement: 全部课表三色图例

在「全部课程」下打开「我的课表」时，系统 SHALL 以三色区分必修课、选修课、其他课程，图例与副标题文案与三类一致；申请与管理员添加 SHALL 使用同一「其他课程」色。

#### Scenario: 全部课表图例

- **WHEN** 学生在全部课程下打开我的课表
- **THEN** 图例显示必修课、选修课、其他课程三项
