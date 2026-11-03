## ADDED Requirements

### Requirement: Student dimension main table is slim without horizontal scroll

选课结果学生维度主表 SHALL 仅展示勾选、序号、学号、姓名、课程代码、课程名称、操作结果与详情操作；学号与姓名 SHALL 左侧冻结，操作结果 SHALL 右侧冻结。主表 MUST NOT 再展示专业、入学批次、批次名称、学分、类型、课程分组、课程来源、选课志愿、操作人、操作时间等列。

#### Scenario: Open student tab

- **WHEN** 用户打开选课结果学生维度
- **THEN** 主表列仅为上述必要列，且行末存在「详情」入口

### Requirement: Detail drawer shows hidden fields plus reason and attachment

点击「详情」SHALL 打开只读详情，展示主表未列出的学生/课程/操作字段，以及原因与附件（无则显示 —）。用户 MUST NOT 在该详情中修改数据。

#### Scenario: View admin-add row detail

- **WHEN** 用户对含代选原因与附件的行打开详情
- **THEN** 详情中可见原因文案与附件文件名
