## 1. 数据层

- [ ] 1.1 创建 `src/data/courseApplications.js`：status/approvalStage 枚举、bloom/teaching/assessment 选项列表、mock 记录（≥6 条，覆盖原型名称/状态）、嵌套 `clos`、`slt`、`approvalLog` 样例
- [ ] 1.2 实现 helper：`createCourseApplicationId`、`createEmptyApplication`、`validateGeneralStep`（复用 `validateCourseForm` 规则）、`validateCloStep`（≥1 CLO）、`validateCloForm`、`validateContentOutline`、`validateContinuousAssessment`、`validateFinalAssessment`、`computeTotalSlt`、`submitApplication`、`canEditApplication`（仅 Temporary saved）、`canSubmitApplication`、`canDeleteApplication`
- [ ] 1.3 创建 `src/utils/exportCourseApplicationExcel.js`：列表列 field 定义

## 2. 列表页

- [ ] 2.1 创建 `src/views/CourseApplicationView.vue`：viewMode 切换（list / apply / detail）
- [ ] 2.2 实现搜索栏：Course Code、Course Name、Offering、Course Classification + More（Status、Applicant 等）
- [ ] 2.3 实现工具栏：Apply New Course、Delete、Import（占位提示）、Export、Submit（仅 Temporary saved）
- [ ] 2.4 实现数据表格：按 status 彩色徽章、Approval Stage、全部列表列、行选择、Actions（Details、Approval Log）
- [ ] 2.5 集成 `TablePagination`、`ConfirmDialog`、`ExportModal`；接入 Submit 与 Delete 规则

## 3. 申请向导 — 壳层

- [ ] 3.1 创建 `CourseApplicationWizard.vue`：横向三步 Stepper（General Information → CLO → SLT）；**步骤可点击；仅当前步标蓝**
- [ ] 3.2 实现顶栏：Back（**始终 ConfirmDialog**）、Previous、Next、**Save**（无 Cancel；Save 在 Next 右侧）
- [ ] 3.3 接入 create、edit（仅 Temporary saved）、只读 detail 模式；Rejected 隐藏 Edit/Submit
- [ ] 3.4 向导主体：**内嵌可滚动内容区**（不用大 Modal 包裹）

## 4. Step 1 — General Information

- [ ] 4.1 创建 `GeneralInformationStep.vue`：**双列 grid**、可滚动；字段来自 `createEmptyCourseForm`（含 prerequisite、synopsis、references）
- [ ] 4.2 复用 `courses.js` 的 `validateCourseForm`；**Credit 输入框占满列宽**（与下拉框同宽）

## 5. Step 2 — CLO

- [ ] 5.1 创建 `CloStep.vue`：CLO 表格（No.、CLO、Outcome、Bloom's Taxonomy Level、Teaching Methods、Assessment Methods、Actions）
- [ ] 5.2 添加 Create / Delete 工具栏；行内 Edit / Delete
- [ ] 5.3 创建 `CloFormModal.vue`：CLO*、Outcome*（0/100）、Bloom*（单选 A1–P7）、Teaching Methods*（多选）、Assessment Methods*（多选）
- [ ] 5.4 当 `clos.length === 0` 时阻止离开 Step 2；展示内联校验提示

## 6. Step 3 — SLT

- [ ] 6.1 创建 `SltStep.vue`：三个区块 Course Content Outline and Subtopics、Continuous Assessment、Final Assessment
- [ ] 6.2 创建 `CourseContentOutlineModal.vue`：Course Content*、CLO*（多选 Step 2）、Learning Time grid（F2F Physical/Online、NF2F）、Total SLT 自动汇总
- [ ] 6.3 创建 `ContinuousAssessmentModal.vue`：Continuous Assessment*、Percentage*、Learning Time（Physical、Online、NF2F）、Total SLT
- [ ] 6.4 创建 `FinalAssessmentModal.vue`：Final Assessment*、Percentage*、Learning Time、Total SLT
- [ ] 6.5 各 SLT 子区块表格 CRUD：Create/Delete 与行操作

## 7. 详情与 Approval Log

- [ ] 7.1 实现 Details 流程（只读向导或独立详情视图），从列表 Actions 进入
- [ ] 7.2 创建 `ApprovalLogModal.vue`：展示 stage、actor、action、date/time、comment 时间线

## 8. 应用集成与 i18n

- [ ] 8.1 在 `App.vue` 注册 `CourseApplicationView`
- [ ] 8.2 在 `menu.js` 的 `developedPages` 加入 `course-application`
- [ ] 8.3 补充 i18n：status、stage、向导标签、SLT 区块（zh-flat + locales）
- [ ] 8.4 冒烟：列表搜索、三步申请流程、Save draft、Submit、Details、Approval Log、Export、Delete

## 9. Import（UI 占位）

- [ ] 9.1 Import 按钮点击后展示占位提示；本阶段不实现 ImportModal 或 xlsx 解析
