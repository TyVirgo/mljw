# 选课管理-学生加退课 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `add-adddrop-course-picker` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 加退课申请以表格单选选择课程
学生加退课/重修申请弹窗的课程字段 必须NOT 使用下拉框列举全部课程。系统 必须提供类似课程库导入的搜索表格选择器，且 必须为单选（一门申请对应一门课）。加课/重修候选 必须来自可选课；退课候选 必须来自已选课。

#### Scenario: 打开课程选择器
- **WHEN** 用户在申请弹窗点击课程「选择」
- **THEN** 打开课程选择器，可按代码/名称搜索并分页浏览候选课

#### Scenario: 单选确认回填
- **WHEN** 用户选中一行并确认
- **THEN** 选择器关闭，申请表单课程字段显示该课代码与名称
- **AND** 提交时使用该课作为申请目标

#### Scenario: 退课候选为已选课
- **WHEN** 申请类型为退课
- **THEN** 选择器列表仅为该生已选课程（可含教学分组与时间）

## 来源 `enrich-student-adddrop-form` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 学生加退课申请表单字段
学生发起加退课/重修申请时 必须选择学年学期、申请类型与课程，并填写申请说明；申请类型文案 必须使用「申请类型」而非「操作类型」；Drop 申请 必须选择退费抵免（是/否）；超期退课 必须额外上传附件。

#### Scenario: 表单步骤与 Drop 字段
- **WHEN** 学生打开发起申请弹窗
- **THEN** 可见学年学期、申请类型、课程、申请说明
- **AND** 选择退课时可见退费抵免是/否
- **AND** 处于超期退课通道时附件为必填

#### Scenario: 提交落库字段
- **WHEN** 学生成功提交申请
- **THEN** 申请单含 academicSession、reason，Drop 含 feeWaiver

## 来源 `polish-adddrop-form-layout` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 加退课申请弹窗布局与 tip 样式
学生加退课申请弹窗 必须采用两列表单布局；退费抵免 必须以单选项展示；必填星号 必须为红色；说明 tip（原灰色 rule）必须使用浅蓝色底与感叹号图标，与其它提示条视觉一致。

#### Scenario: 弹窗字段布局
- **WHEN** 学生打开发起申请弹窗
- **THEN** 学年学期与申请类型等同排两列展示
- **AND** 退费抵免为是/否单选而非下拉
- **AND** 必填标签星号为红色

#### Scenario: tip 样式
- **WHEN** 页面展示 rule 类说明条或弹窗 Drop 通道说明
- **THEN** 底色为浅蓝且图标为感叹号

## 来源 `polish-adddrop-label-intake-desc` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 加退课文案与菜单一致
批次表单加退课时间区块与批次列表对应列标题 必须使用「加退课/重修申请」，与学生菜单文案一致。

### Requirement: 批次类选项倒序
学年学期与学生范围「批次」下拉中的日期型选项 必须按新到旧倒序排列；「全部」或「请选择」必须仍位于列表最前（由 UI 固定）。

## 来源 `polish-demo-teaching-week-callout` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 演示教学周与提示条一体展示
学生加退课页原型期的「演示教学周」控件 必须与通道说明位于同一 tip 条带内：共用底色与边框，标签字体与说明协调；必须NOT 在条带外单独成白底区块。

#### Scenario: 整行一体
- **WHEN** 学生打开加退课页
- **THEN** 通道说明与演示教学周处于同一连续底色行内
- **AND** 演示周标签字色/字号与说明文案协调

## 来源 `polish-student-adddrop-list` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 学生加退课列表布局与 demo
系统 必须在学生加退课页提供标准搜索区与 toolbar 发起申请；通道提示与演示教学周 必须同一行且演示选项靠右；申请列表 必须分页展示，demo 覆盖各类型/状态/退课通道；非退课类申请退课通道列 必须显示「非退课申请」而非占位符。

#### Scenario: 搜索与发起申请位置
- **WHEN** 学生打开加退课/重修申请页
- **THEN** 可见类型、状态、关键词搜索与查询/重置
- **AND** 「发起申请」位于搜索区下方 toolbar

#### Scenario: 列表数据与退课通道列
- **WHEN** 列表渲染 demo 申请
- **THEN** 可见分页且涵盖 Add/Drop/Retake/Replace/AddDrop 与多种审批状态
- **AND** 退课类显示自助或特殊审批；加课/重修等显示「非退课申请」
