## ADDED Requirements

### Requirement: 其他类文案

二级筛与课表图例中原「其他课程」SHALL 展示为「申请和添加课程」。

#### Scenario: 查看二级筛

- **WHEN** 学生打开我的课程
- **THEN** 可见「申请和添加课程」筛选项

### Requirement: 可收放搜索与拆分条件

搜索区 SHALL 支持收放；课程名称与课程代码 SHALL 为两个独立模糊条件；任课教师 SHALL 为模糊输入；起止周 SHALL 为起止两个输入并按周次区间交集过滤；提交时间 SHALL 为日期区间；上课星期 SHALL 为单选星期过滤。

#### Scenario: 按周二筛选

- **WHEN** 学生选择上课星期「周二」并查询
- **THEN** 仅保留上课时间含周二的课程行
