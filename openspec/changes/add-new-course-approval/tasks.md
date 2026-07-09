## 1. 数据层与共享状态

- [ ] 1.1 在 `courseApplications.js`（或 `courseApproval.js`）新增审批 helper：`getApprovalQueue`、`canApproveApplication`、`applyApprovalDecision`、`advanceApprovalStage`、`returnApplicationToDraft`、`rejectApplication`、`archiveApplicationToCourses`
- [ ] 1.2 定义审批动作枚举：Approved、Rejected、Update Required；阶段流 HoD/HoP Review → Senate Review → Approved
- [ ] 1.3 引入共享状态（store 模块或 App 级 provide），使 Course Application Submit 与 Course Approval 决策变更同一 applications/courses 集合
- [ ] 1.4 新增 Common Comments 静态预设（3–5 条模板）供审批 Modal 使用

## 2. 审批 Modal

- [ ] 2.1 创建 `CourseApprovalModal.vue`：标题、当前环节 intro、Action 单选、Comments 文本域（100 字限制 + 计数器）、Common Comments 预设选择（3–5 条静态项）
- [ ] 2.2 接入 Cancel / Confirm；校验 Action 已选；Rejected 与 Update Required 时 Comments 必填
- [ ] 2.3 Confirm 时对每条目标 id（单条或批量）调用 `applyApprovalDecision` 并关闭 Modal；刷新列表

## 3. 列表页 — CourseApprovalView

- [ ] 3.1 创建 `src/views/CourseApprovalView.vue`：viewMode list / detail
- [ ] 3.2 实现搜索：第一行（Course Code、Course Name、Offering + Search/Reset/More 右对齐），第二行（Course Classification + 展开 Status/Applicant）；标签冒号对齐
- [ ] 3.3 实现工具栏：Approval（批量：同一 approvalStage + In Progress）、Export
- [ ] 3.4 实现表格：列含 **Course Code**（Approval Stage 之后）、status 徽章、Actions sticky、行 nowrap
- [ ] 3.5 行操作：仅 Details、Approval Log
- [ ] 3.6 集成 TablePagination、ExportModal、ApprovalLogModal、`CourseApplicationWizard`（detail）

## 4. 审批流程集成

- [ ] 4.1 工具栏 Approval 打开 `CourseApprovalModal`，传入选中 id(s)；批量时强制同一 approvalStage
- [ ] 4.2 实现 Approved 路径：阶段推进；Senate 终审 → status Approved + 归档至 courses
- [ ] 4.3 实现 Rejected 路径：终态 Rejected + approvalLog
- [ ] 4.4 实现 Update Required 路径：Temporary saved + 移出审批队列
- [ ] 4.5 确保 Course Application Submit 后记录进入审批队列

## 5. 导出与 i18n

- [ ] 5.1 创建 `exportCourseApprovalExcel.js`：列表 field 定义
- [ ] 5.2 补充 i18n：Approval、Action、Comments、Common Comments、Update Required、审批 intro 文案、审核/通过/拒绝/驳回/办理意见/常用意见
- [ ] 5.3 在 `App.vue` 注册 `CourseApprovalView`；`developedPages` 加入 `course-approval-process`

## 6. 验证

- [ ] 6.1 冒烟：Course Application Submit → 出现在 New Course Approval
- [ ] 6.2 冒烟：HoD Approved → Senate 阶段；Senate Approved → Course Information 新增行
- [ ] 6.3 冒烟：Update Required → 回到 Course Application 可编辑草稿
- [ ] 6.4 冒烟：批量 Approval（同一 stage）对所选行应用同一决策
- [ ] 6.5 冒烟：Rejected → 两模块均只读
- [ ] 6.6 运行 `npm run build`
