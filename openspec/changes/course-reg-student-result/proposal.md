# 选课管理-学生选课结果与历史

> 本变更包由同菜单下多个历史 OpenSpec 变更合并而成，供后续整理需求文档使用。实现状态以原型代码为准；本包作为需求沉淀，不重复驱动增量开发。

## 背景与动机

将「选课管理-学生选课结果与历史」相关的零散提案合并为一份连贯需求说明，便于按菜单编写正式需求文档，并减少 openspec/changes 目录噪音。

## 能力范围（按逻辑分组）

### enrich-student-history-batch-retake

**动机**

选课历史缺批次与是否重修，不便核对重修课与所属批次；列多后表格被压换行，批次名称与上课时间难扫读；操作人「自选显示 —」与业务不符。

**变更要点**

- 选课历史表增加「批次名称」「是否重修」（是/否）

### polish-student-waitlist-list

**动机**

学生候补结果页过于简陋：无搜索区、仅 1 条 demo、无分页；表格仅 5 列且顺位等字段易出现占位符，无法对照选课结果理解候哪门课、排第几、何时申请。

**变更要点**

- 增加搜索区（审批状态、课程名称/代码）+ 查询/重置

### refine-student-my-result-unselect

**动机**

「我的选课结果」需对齐在线选课确认后的回显形态：列表检索 + 与选课结果一致的字段，并支持选课阶段内的「退选」（释放名额）。当前页仍有轮次时间条、字段与操作不完整，且易与开课后的「退课 Drop」混淆。

**变更要点**

- 去掉结果页 `RoundTimelineBar` 等轮次卡片；保留 `ModuleBrief` 与必要说明（含退选/退课语义区分）

### remove-student-my-schedule

**动机**

学生端「我的课表」与「我的选课结果」能力重叠，评审中决定收敛入口：侧栏不再提供独立课表菜单；选课队列成功后的主 CTA 改为进入「我的选课结果」。

**变更要点**

- 从选课侧栏学生组移除「我的课表」（`crs-schedule`）

### remove-waitlist-enrich-history-search

**动机**

学生端「候补结果」入口冗余；选课历史仅能按课程名搜；可选学生名单按批次/学院筛选对单条范围场景用处不大。

**变更要点**

- 去掉学生菜单「候补结果」及页面路由入口；更新相关提示与流程指引引用

### rename-result-waitlist-add-selected-at

**动机**

学生端菜单「我的选课结果 / 我的候补」命名偏口语且与业务称呼不一致；选课结果列表缺少「选课时间」（在线选课提交成功时刻），无法对照图示与真实业务字段。

**变更要点**

- 菜单：我的选课结果 → 选课结果；我的候补 → 候补结果（含侧栏与相关提示文案对齐）

### rename-section-code-to-group-name

**动机**

教学分组展示误用「分组编号」；业务上该字段是分组名称。列头与选课弹层已改为「分组名称」，但单元格仍只显示 `01`，应与弹层一致展示完整名称「分组名称01」。

**变更要点**

- i18n：`courses.sectionCode` / `waitlist.section` 改为「分组名称」/「Group Name」

## 合并来源

- `enrich-student-history-batch-retake`
- `polish-student-waitlist-list`
- `refine-student-my-result-unselect`
- `remove-student-my-schedule`
- `remove-waitlist-enrich-history-search`
- `rename-result-waitlist-add-selected-at`
- `rename-section-code-to-group-name`

## 增量（2026-07 选课历史学年学期与左冻结）

- 选课历史表在课程名称后增加「学年学期」列；搜索区同步增加学年学期下拉。
- 表区保持横向滚动；冻结序号、课程代码、课程名称前三列。

## 能力标识

- `course-reg-student-result`：选课管理-学生选课结果与历史（合并需求包）

## 影响范围

- 对应模块菜单下的列表/表单/抽屉/导出与演示数据
- i18n（中/英）与导航配置
- 本包以文档沉淀为主；代码已在各次 apply 中落地
