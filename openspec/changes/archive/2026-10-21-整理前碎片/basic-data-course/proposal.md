# 基础数据-课程信息与开课申请

> 本变更包由同菜单下多个历史 OpenSpec 变更合并而成，供后续整理需求文档使用。实现状态以原型代码为准；本包作为需求沉淀，不重复驱动增量开发。

## 背景与动机

Course Info 模块承载课程进入正式库前的申请、变更、审批及正式课库维护。历史迭代从占位页补齐新课程申请、课程变更申请、新课程审批三条链路，并统一先修课选择、列表筛选与审批交互。本包按「申请 → 审批 → 入库/回写」链路重组，便于写需求文档。

## 能力范围（按逻辑分组）

### 1. 新课程申请

- 新增 **Course Application** 主页面：列表、分页、批量选择、搜索/重置、More 展开高级筛选。
- 三步申请向导：General Information → CLO → SLT；详情/审批日志及批量操作，支撑 HoD/HoP、Senate 等审批阶段演示。

### 2. 课程变更申请

- 新增 **Course Change Application** 列表页：基于 Course Information 中已生效课程带出原课基线，四步表单、暂存/送审/撤回及多级审批；终审通过自动回写源课程档案。
- Step 1（变更说明）重构为三列表格布局（Component Name / Major Changes / Minor / No Changes），含 pill 开关与分项说明 bullet list。

### 3. 新课程审批

- 新增 **New Course Approval** 列表页（审批角色专用）：数据来自 Course Application 已 Submit 单据；展示 In Progress 及历史审批态，**不展示** Temporary saved 草稿。
- 终审通过归档至 Course Information；驳回/需修改退回申请端草稿。

### 4. 先修课选择弹窗

- 重构 `CoursePrerequisiteModal.vue`，对齐原型 **Add** 弹窗：完整检索区、宽表格（Offering、Credit Value、课程性质）、分页与 Discard / Confirm 底栏。

### 5. 课程列表与导入体验

- 在线选课相关课程列表：名额列不再混入「已选/排队中」；不可选行不再整行置灰（详情仍可用）；学分列表头增加筛选；不可选时以清晰原因提示。
- Course Information 列表：不可选操作改为感叹号 + tooltip；补齐 demo 状态与先修失败原因；增加分页。
- 「从课程库导入」弹窗页脚对齐 `StudentSelectModal` / `CourseSelectModal`：左 `footer-pagination` + 右 `footer-actions`。

### 6. 审批操作文案统一

- 审核弹框操作单选中文统一为 **通过 / 不通过 / 驳回**（替代「已通过 / 已驳回 / 驳回」结果态描述），所有使用该弹框的入口保持一致。

## 合并来源

见同目录 `SOURCES.md`（9 个历史变更）。

## 能力标识

- `basic-data-course`：基础数据-课程信息与开课申请（合并需求包）

## 影响范围

- Course Application / Course Change Application / New Course Approval / Course Information
- 先修课弹窗、变更说明向导、课程库导入弹窗
- i18n（中/英）与审批流程 demo 数据
