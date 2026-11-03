## ADDED Requirements

### Requirement: 加退重修申请按 PDF Notes 分节条件展示
学生发起加退课/重修申请时，系统 MUST 以分节表单呈现，并按申请类型仅展示对应业务节；Section I（学生信息）与 Section V（学生声明）MUST 始终可见。Add MUST 展示 Section II；Drop MUST 展示 Section III；Retake MUST 展示 Section IV；联合类型 AddDrop MUST 同时展示 Section III 与 Section II。每节 MUST 仅对应一门课程（与既有单选选课器一致）。

#### Scenario: 选择加课仅见加课节
- **WHEN** 学生在申请弹窗将申请类型设为 Add
- **THEN** 可见 Section I、Section II 与 Section V
- **AND** 不可见 Section III 与 Section IV

#### Scenario: 选择退课仅见退课节
- **WHEN** 学生将申请类型设为 Drop
- **THEN** 可见 Section I、Section III 与 Section V
- **AND** 不可见 Section II 与 Section IV

#### Scenario: 选择重修仅见重修节
- **WHEN** 学生将申请类型设为 Retake
- **THEN** 可见 Section I、Section IV 与 Section V
- **AND** 不可见 Section II 与 Section III

#### Scenario: 联合加退展示退课与加课节
- **WHEN** 学生将申请类型设为 AddDrop
- **THEN** 可见 Section I、Section III、Section II 与 Section V
- **AND** 退课与加课各通过选课器选择至多一门课

### Requirement: 申请表单样式对齐学籍异动多分节
加退重修申请弹窗 MUST 采用与学籍异动申请一致的展示形式：顶部 Notes 说明、灰色 `section-bar` 分节标题、分节内两列表单网格，以及声明区黄底勾选；MUST NOT 使用多步骤向导作为主交互。

#### Scenario: 打开弹窗可见分节灰条与 Notes
- **WHEN** 学生打开发起申请弹窗
- **THEN** 顶部可见包含 PDF Notes 要点的说明（含按类型填写哪些节、每节一门课）
- **AND** 各可见节以灰色分节条标注 Section 标题（如 SECTION I / II / III / IV / V）

### Requirement: 分节关键字段与选课回填
系统 MUST 在各可见节收集与 PDF 对齐的关键信息：Section I 至少含可编辑联系电话；Section II/III/IV 在选课确认后 MUST 回填或展示课号/课名（及组号若有）、上课日时段地点、教师等只读信息；Section II MUST 含加课类型；Section III MUST 含退课原因，并保留退费抵免及既有附件规则；Section IV MUST 含曾修课程、成绩、曾修学年学期、重修类型及本学期重修课程信息；Section V MUST 要求学生勾选声明后方可提交。

#### Scenario: 选课回填课表信息
- **WHEN** 学生在 Section II、III 或 IV 通过选课器确认一门课
- **THEN** 该节展示该课的代码、名称及可从教学班推导的时段地点与教师（无数据时显示占位「—」）

#### Scenario: 未勾选声明不可提交
- **WHEN** 学生已填完可见节必填项但未勾选 Section V 声明
- **THEN** 提交被阻止并提示须同意声明

#### Scenario: 提交持久化分节字段
- **WHEN** 学生勾选声明并成功提交
- **THEN** 申请记录保存所填分节字段（含联系电话、类型枚举、原因、重修相关字段及课信息快照），供详情回看

### Requirement: 详情按相同分节只读展示
学生端与管理端（含审批）查看加退重修申请详情时，MUST 按申请类型对应的 Section 灰条分区只读展示已填内容；未涉及的节 MUST NOT 展示为空业务节（可省略整节）。

#### Scenario: 加课申请详情分节
- **WHEN** 用户打开类型为 Add 的申请详情
- **THEN** 可见 Section I、II、V 的只读内容
- **AND** 不展示 Section III、IV 业务块
