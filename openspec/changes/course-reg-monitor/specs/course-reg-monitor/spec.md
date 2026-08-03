# 选课管理-选课监控 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `merge-academic-alert-into-monitor` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 选课监控单表承载学业预警
学生选课监控 必须在同一列表中展示问题类型、严重度与处置建议（无问题时可为空）。系统 必须支持按「仅异常学生」、严重度、问题类型筛选，且 必须提供将学生加入补注册名单的入口（含跳转补注册名单）。

#### Scenario: 异常学生可见建议
- **WHEN** 管理员打开学生选课监控且列表中存在非正常状态学生
- **THEN** 该行展示对应问题类型、严重度与建议文案

#### Scenario: 仅看异常
- **WHEN** 管理员选择仅异常或点击高/中预警统计卡
- **THEN** 列表仅显示存在学业问题的学生

### Requirement: 不再提供独立学业预警菜单
系统 必须NOT 在侧栏展示「学业预警」菜单项；`cr-alert` 必须NOT 列入已开放页面。

#### Scenario: 侧栏无学业预警
- **WHEN** 管理员查看选课模块侧栏
- **THEN** 不可见「学业预警」菜单项

## 来源 `polish-round-status-list-ux` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 本轮选课情况状态范围
本轮选课情况 必须仅展示排队中、成功、失败的数据行，必须NOT 展示取消选课行。

### Requirement: 去掉批量退课与多选
本轮选课情况 必须NOT 提供批量退课按钮与行首多选框；成功课程的单课退选入口 MAY 保留。
