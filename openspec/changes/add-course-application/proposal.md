## 背景与动机

Course Info → **Course Application**（课程申请）菜单目前指向「建设中」占位页。该模块是课程进入正式库（Course Information）前的申请与审批入口，需按原型提供列表检索、三步申请向导（General Information → CLO → SLT）、详情/审批日志及批量操作，以支撑 HoD/HoP、Senate 等审批阶段的业务演示。

## 变更内容

- 新增 **Course Application** 主页面：列表、分页、批量选择、搜索/重置、More 展开高级筛选
- 新增 **Apply New Course** 全页三步向导：**Step 1 内嵌可滚动表单**（双列 grid，无大弹窗）；Stepper **可点击跳转、仅当前步标蓝**；顶栏 **Back（二次确认）| Previous | Next | Save**（无 Cancel）
  1. **General Information** — 与 Course Information **完全相同的 8 个字段**
  2. **Course Learning Outcome (CLO)** — CLO 表格 CRUD + Create 子弹窗（**至少 1 条 CLO 必填**）
  3. **Student Learning Time (SLT)** — 课程内容大纲、Continuous Assessment、Final Assessment 子模块及对应 Create 弹窗
- 新增 **Details** 只读详情（复用向导结构或独立详情视图）
- 新增 **Approval Log** 弹窗/侧栏，展示审批阶段历史
- 工具栏：**Apply New Course**、Delete、Import（**UI 占位**）、Export、Submit（仅 Temporary saved 可 Submit；**Rejected 不可编辑/重提**）
- 列表列：Status（彩色标签）、Approval Stage、Course Name、Offering、Course Classification、Credit、Applicant、Application Date and Time、Actions（Details、Approval Log）
- 状态枚举：In Progress、Approved、Temporary saved、Rejected
- 本地 mock 数据层（≥6 条，与原型样例一致），复用 `courses.js` 中 Offering、Course Classification 等枚举
- 将 `course-application` 加入 `developedPages`，并在 `App.vue` 注册视图
- **首版无真实审批引擎/API**；Import 仅 UI 占位提示

## 能力范围

### 新增能力

- `course-application`: 课程申请全流程——列表检索、状态与审批阶段展示、三步申请向导、CLO/SLT 嵌套 CRUD、详情、审批日志、导出/删除/提交

### 修改的能力

（无现有 spec，留空）

## 影响范围

- **新增文件**
  - `src/views/CourseApplicationView.vue`
  - `src/components/courseApplication/CourseApplicationWizard.vue`
  - `src/components/courseApplication/CloFormModal.vue`
  - `src/components/courseApplication/CourseContentOutlineModal.vue`
  - `src/components/courseApplication/ContinuousAssessmentModal.vue`
  - `src/components/courseApplication/FinalAssessmentModal.vue`
  - `src/components/courseApplication/CourseApplicationDetailView.vue`（或 wizard 只读模式）
  - `src/components/courseApplication/ApprovalLogModal.vue`
  - `src/data/courseApplications.js`
  - `src/utils/exportCourseApplicationExcel.js`
- **修改文件**
  - `src/App.vue` — 注册视图
  - `src/config/menu.js` — `developedPages` 加入 `course-application`
  - `src/i18n/zh-flat.js`、`src/i18n/locales/en.js`、`src/i18n/locales/zh.js` — 页面文案
- **复用**
  - `ConfirmDialog`、`ExportModal`、`TablePagination`、`useListPageI18n`
  - `courses.js` — `courseClassificationOptions`、`getOfferingOptions`、`mediumOfInstructionOptions` 等
- **无后端依赖**：首版 mock + localStorage 可选持久化
