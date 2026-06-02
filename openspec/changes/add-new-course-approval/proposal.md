## Why

Course Info → **New Course Approval**（新课程审批）菜单目前无实现，仍为占位路由。该模块是**审批角色专用**入口：数据来自 **Course Application** 已 Submit 的单据，需在列表中按审批节点完成立项审批、查阅申报详情与全流程履历；终审通过后归档至 **Course Information**，驳回/需修改则退回申请端草稿。缺少该页则申请—审批—入库链路无法闭环演示。

## What Changes

- 新增 **New Course Approval** 列表页：仅展示已送审（`In Progress` / 审批中）及历史审批态（含 `Approved`、`Rejected` 等）的申请单；**不展示** `Temporary saved` 草稿
- 列表列：No.、Status、Approval Stage、**Course Code**、Course Name、Offering、Course Classification、Credit、Applicant、Application Date and Time、Actions（**Details**、**Approval Log**；审批人侧无 Edit/Delete）
- 搜索：Course Code、Course Name、Offering、Course Classification（第一行筛选项 + 右侧 Search / Reset / More；标签冒号对齐，与 Course Application 列表风格一致）
- 工具栏：**Approval**（**支持批量**：勾选多条可审批记录，同一 Action/Comments 一次性提交）、**Export**
- 新增 **Approval 审批弹窗**（见原型）：
  - 标题 Approval / 审核
  - 提示语含当前审批环节（如 Current QA / 当前：QA）
  - **Action** 单选：Approved、Rejected、Update Required（中文：通过 / 拒绝 / 驳回）
  - **Comments** 多行文本 0/100，含 **Common Comments / 常用意见**（**首版 3–5 条静态模板**）
  - Cancel、Confirm
- 审批结果流转（mock）：
  - **Approved**：按节点推进（HoD/HoP Review → Senate Review → Approved）；终审通过后写入 **Course Information** 并更新申请单 status
  - **Rejected**：申请单 status = Rejected，保留在审批列表只读
  - **Update Required**：申请单退回 Course Application，status = Temporary saved，approvalStage = `--`，追加 approvalLog
- 复用 **CourseApplicationWizard** 只读模式作 **Details**；复用 **ApprovalLogModal**
- 注册 `course-approval-process` 至 `developedPages` 与 `App.vue`
- 首版无真实 RBAC/工作流引擎；当前审批角色与节点以 mock 常量模拟

## Capabilities

### New Capabilities

- `new-course-approval`: 新课程审批列表、检索、Approval 弹窗、审批动作与状态流转、详情/履历、导出，及与 Course Application / Course Information 的数据联动

### Modified Capabilities

- `course-application`: 审批驳回（Update Required）后申请单回到 Temporary saved 可重新编辑提交；终审 Approved 后从申请端只读展示

## Impact

- **新增文件**
  - `src/views/CourseApprovalView.vue`
  - `src/components/courseApproval/CourseApprovalModal.vue`
  - `src/data/courseApproval.js`（或扩展 `courseApplications.js` 的审批 helper）
  - `src/utils/exportCourseApprovalExcel.js`
- **修改文件**
  - `src/App.vue`、`src/config/menu.js`
  - `src/data/courseApplications.js` — 审批动作、阶段推进、与 courses 归档
  - `src/data/courses.js` — 终审通过后新增课程档案（若尚无同 Course Code）
  - `src/i18n/zh-flat.js`、`src/i18n/locales/en.js`、`src/i18n/locales/zh.js`
- **复用**
  - `CourseApplicationWizard`（detail 模式）、`ApprovalLogModal`、`ExportModal`、`TablePagination`、`ConfirmDialog`、`useListPageI18n`
- **无后端依赖**：与 Course Application 共享 mock 数据源（内存 ref，可选 localStorage 同步）
