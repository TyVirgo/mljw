## 背景与动机

Course Info → **Course Change Application**（课程变更申请）菜单目前为占位页。该模块面向**已在 Course Information 中生效的正式课程**，允许申请人基于系统带出的原课程基线发起修订，经变更说明标注、四步表单填报、暂存/送审/撤回及多级审批后，终审通过自动回写更新源课程档案；驳回或需修改的单据退回草稿可重新编辑提报。缺少该页则「正式课库 → 变更申请 → 审批 → 回写」链路无法演示。

## 变更内容

- 新增 **Course Change Application** 列表页：分页、批量选择、搜索/重置/More；列与原型一致
- 新增 **Create**（新增申请）四步全页向导：
  1. **Change Description（变更说明）** — 选择基线课程（Course Name + Choose）；MAIN / OTHER COMPONENTS 各字段标注 **Major Changes** 或 **Minor / No Changes**（Y/N 切换）
  2. **Basic Information（基础信息）** — 与 Course Information 相同字段，由所选基线课程自动带出并可编辑
  3. **Course Learning Outcome (CLO)** — 表格 CRUD（至少 1 条 CLO 必填）
  4. **Student Learning Time (SLT)** — 复用 SLT 子模块（课程内容大纲、Continuous Assessment、Final Assessment）
- 顶栏：**Back（二次确认）| Cancel | Previous | Next | Save**（最后一步 Save）；Stepper **可点击、仅当前步标蓝**
- 工具栏：**Create**、Delete、Export、Submit（仅 Temporary saved）、**Withdraw**（仅 In Progress 可撤回至草稿）
- 列表列：No.、Status、Approval Stage、Course Name、Offering、Course Classification、Credit、Applicant、Application Date and Time、Actions
- 搜索字段：Course Code、Course Name、Offering、Course Classification（第一行三字段 + Search/Reset/More 靠右；第二行 Course Classification；标签冒号对齐）
- 状态：In Progress、Approved、Temporary saved、Rejected；审批环节与 Course Application 对齐（HoD/HoP Review → Senate Review → Approved）
- 操作列：Temporary saved → **Edit**、Approval Log；In Progress / Approved → **Details**、Approval Log；**Rejected 只读终态** → 仅 Details、Approval Log（无 Edit/Submit/Withdraw）
- **Course Code 不可修改**：向导 Step 2 只读，与基线课程一致
- 终审回写：首版提供 **`applyApprovedChangeToCourse`** helper；完整审批 UI 在 **Course Change Review** 模块
- 终审 Approved 后 mock **回写 Course Information**（复用 `buildCourseChangeLogs` 追加 changeRecords）
- Submit / Withdraw / Delete 均需 **ConfirmDialog 二次确认**
- 注册 `course-change-application` 至 `developedPages` 与 `App.vue`
- **首版不含 Course Change Review**（审批端为独立菜单，后续变更）；无真实 API/RBAC

## 能力范围

### 新增能力

- `course-change-application`: 课程变更申请——基线选课、变更说明、四步向导、列表检索、暂存/送审/撤回、详情/审批日志、终审回写 Course Information

### 修改的能力

- `course-information`: 变更终审通过后源课程数据被 mock 更新并追加变更记录（changeRecords）

## 影响范围

- **新增文件**
  - `src/views/CourseChangeApplicationView.vue`
  - `src/components/courseChange/CourseChangeWizard.vue`
  - `src/components/courseChange/ChangeDescriptionStep.vue`
  - `src/components/courseChange/CourseSelectModal.vue`（从 Course Information 选课）
  - `src/data/courseChangeApplications.js`
  - `src/data/courseChangeStore.js`（或与 `courseStore.js` 扩展共享 ref）
  - `src/utils/exportCourseChangeApplicationExcel.js`
- **修改文件**
  - `src/App.vue`、`src/config/menu.js`
  - `src/data/courseStore.js` — 暴露 `courses` 供选课与回写
  - `src/i18n/zh-flat.js`、`src/i18n/locales/en.js`、`src/i18n/locales/zh.js`
- **复用**
  - `CourseSLTStepPanel`、`CourseCLOFormModal`、`CourseGeneralInfoDetail`（详情只读）
  - `CourseDetailStepper`、`ApprovalLogModal`、`ConfirmDialog`、`ExportModal`、`TablePagination`
  - `courses.js` 枚举、`buildCourseChangeLogs`、`courseApplications.js` 状态/badge 模式
- **无后端依赖**：mock + 与 Course Information 共享内存 store
