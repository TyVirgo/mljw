## ADDED Requirements

### Requirement: Invite hours inline on supplement parent

白名单表单 MUST 在「允许加退课/重修申请」勾选项后以「，申请时长为」连接小时数字输入与单位 h。MUST NOT 再展示独立的「权限有效时长设置」区块。

#### Scenario: Inline hours

- **WHEN** 教务勾选允许加退课/重修申请
- **THEN** 同行可见「申请时长为」与小时输入；无独立时长标题区块

### Requirement: Future mandatory requires course sections

勾选「允许添加未来学期必修课申请」后，MUST 选择至少一门必修的课号+教学班（多选）。选组控件 MUST 采用与「课程豁免先修课」相同的下方整行布局（标签+必填星+选择），MUST NOT 挤在勾选旁。加课池未来学期必修 MUST 仅包含白名单清单中的课+组。

#### Scenario: Save without sections blocked

- **WHEN** 勾选未来学期必修但未选任何分组后保存
- **THEN** 保存失败并提示必选

#### Scenario: Picker layout mirrors prereq

- **WHEN** 勾选允许添加未来学期必修课申请
- **THEN** 下方出现「未来学期必修课分组 *」整行选择区（与先修豁免课程选择区同结构）

### Requirement: Same-term core re-add only original section by default

加课与加退关联中，若申请内已退某本学期必修的某分组，则加课侧该课 MUST 默认仅允许加回**相同课程分组**；其他分组 MUST 展示但禁用并说明不可换组。若该分组名额已满 MUST 不可选。有「可加课」下「本学期必修课允许换组」且白名单含该课目标分组时，这些分组 MUST 可选。

#### Scenario: Drop 01 only add 01

- **WHEN** 学生退 MATH101 分组01且无换组白名单，打开加课选 MATH101
- **THEN** 分组01可选（名额允许时）；分组02置灰不可换组

#### Scenario: Whitelist unlocks other section on add

- **WHEN** 可加课换组白名单含 MATH101-02，学生已退 MATH101-01
- **THEN** 加课可选 MATH101-02

### Requirement: Retake section switch whitelist

重修（含重修退课）对必修换组 MUST 与加课相同：默认不可换组（有原分组时其他组置灰）；「可重修」下「本学期必修课允许换组」且清单命中时可选。加课与重修换组白名单 MUST 分立配置。

#### Scenario: Separate add/retake switch lists

- **WHEN** 仅配置可加课换组含 A-02，未配置可重修换组
- **THEN** 加课可选 A-02；重修仍不可选 A-02（无原组锁时除外）

### Requirement: Drop below term credit min whitelist

系统 MUST 在**仅退课**申请中默认禁止退课后学期学分低于该学期最低学分（`resolveTermCreditMin`）。白名单权限「退课允许低于12学分」（`allowDropBelowCreditMin`）勾选后 MUST 允许仅退课低于该保底。本权限 MUST NOT 自动放行 AddDrop / RetakeDrop。

#### Scenario: Pure drop blocked below min

- **WHEN** 学生仅退课且无 `allowDropBelowCreditMin`，退课后净学分低于学期最低
- **THEN** 提交失败并提示不可低于最低学分

#### Scenario: Whitelist allows drop below min

- **WHEN** 白名单已开 `allowDropBelowCreditMin`，学生仅退课导致净学分低于学期最低
- **THEN** 校验放行该学分闸

### Requirement: Future elective allowance copy

未来学期选修额度块 MUST NOT 展示 GE 大课程组说明句。GE/ME 学分输入 MUST 使用「GE允许选择 / ME允许选择」+ 数字 +「学分」文案。ME 类别标题 MUST 为「ME 课程组允许选择类别」。

#### Scenario: GE ME labels

- **WHEN** 勾选允许添加未来学期选修课申请
- **THEN** 可见「GE允许选择」「ME允许选择」与学分单位；无 GE 说明段落；ME 类别标题为允许选择类别

### Requirement: Section picker merges course sections

白名单选组弹框（未来必修 / 换组）MUST 将同课号的不同课程分组合并展示：课级列（勾选/课号/名称/学分）使用 rowspan，组级列每组一行且竖直对齐。MUST 每门课仅一个多选框。勾选一门课 MUST 选中或取消该课全部教学班引用；确认写入仍为课+组清单。

#### Scenario: One checkbox per course

- **WHEN** CHEM101 有分组 01 与 02，打开未来学期必修选组弹框
- **THEN** CHEM101 仅一个多选框（课级 rowspan）；勾选后清单含 CHEM101-01 与 CHEM101-02

### Requirement: Add CORE same-section lock from eligibility origin

纯加课申请中，曾退/落下的本学期必修 MUST 展示该课全部分组；默认仅允许选择资格中的原分组；其他分组 MUST 置灰并说明不可换组。有可加课换组白名单且目标组在清单中时 MUST 可选。原组来源优先为申请内 dropLines，否则为资格种子 `originalSectionCode`。

#### Scenario: Prior drop CHEM101 only section 01

- **WHEN** 学生加课选 CHEM101，资格原组为 01，无换组白名单
- **THEN** 分组 01 可选；分组 02 置灰不可换组

### Requirement: Add CORE original academic session populated

加课选课器必修 Tab「原上课学期」列 MUST 对展示中的必修行给出非空学期值（曾退/落下为原上课学期；未来学期必修为计划开课学期）。Demo 种子 MUST 补全该字段。

#### Scenario: No dash for core original session

- **WHEN** 打开加课必修 Tab 看到 CHEM101 / PHYS101 等
- **THEN** 「原上课学期」列均有 `YYYY/MM` 值，不得为 —
