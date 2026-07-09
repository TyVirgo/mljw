## 1. 数据层与共享状态

- [ ] 1.1 创建 `src/data/courseChangeApplications.js`：status/stage 枚举、四步 `courseChangeSteps`、mock 记录（≥6 条）、changeDescription schema、helper（`canEdit`、`canSubmit`、`canWithdraw`、`canDelete`、`submitChangeApplications`、`withdrawChangeApplications`）
- [ ] 1.2 创建或扩展 `courseChangeStore.js` / `courseStore.js`：共享 `courseChangeApplications` ref 与 **`applyApprovedChangeToCourse()`** helper（Review 模块终审 Approved 时调用；申请端 v1 无审批 UI）
- [ ] 1.3 实现基线拷贝 helper：`loadBaselineFromCourse(course)` → form、clos、slt、baselineSnapshot；**courseCode 锁定为基线值**
- [ ] 1.4 补充校验：step1（基线 + changeDescription）、step2（general form，**courseCode === baselineSnapshot.courseCode**）、step3（≥1 CLO）；Rejected 标记为不可编辑/不可撤回

## 2. 选课 Modal

- [ ] 2.1 创建 `CourseSelectModal.vue`：从共享 `courses` ref 列出课程；列 Course Code、Course Name、Offering、Classification；单选 + Confirm/Cancel
- [ ] 2.2 在 Change Description 步骤接入 Choose 按钮；首次 Save 后锁定基线

## 3. Change Description 步骤

- [ ] 3.1 创建 `ChangeDescriptionStep.vue`：MAIN COMPONENTS（Course Name、Credit Value、Course Classification、CLO）与 OTHER COMPONENTS（Synopsis、Pre-requisite、Teaching Methods、Course Content、Assessment Methods、References）
- [ ] 3.2 实现 Major Changes (N) / Minor / No Changes (Y) 切换，样式对齐原型
- [ ] 3.3 每行补充 helper 说明文案（i18n）；详情模式只读

## 4. 四步向导

- [ ] 4.1 创建 `CourseChangeWizard.vue`：viewMode create / edit / detail；复用 `CourseDetailStepper` 四步
- [ ] 4.2 Step 2：Basic Information 表单 grid；**Course Code 字段只读**（与基线一致）
- [ ] 4.3 Step 3：CLO 表格 + `CourseCLOFormModal`；Step 4：`CourseSLTStepPanel`
- [ ] 4.4 顶栏：Back/Cancel（ConfirmDialog）、Previous、Next、Save；详情模式：Back、Previous、Next、Export 占位
- [ ] 4.5 详情模式：Step 1 只读变更表；Step 2 `CourseGeneralInfoDetail`；CLO 分页；SLT 只读

## 5. 列表页 — CourseChangeApplicationView

- [ ] 5.1 创建 `src/views/CourseChangeApplicationView.vue`：viewMode list / create / edit / detail
- [ ] 5.2 搜索：第一行（Course Code、Course Name、Offering + Search/Reset/More），第二行（Course Classification）；标签冒号对齐
- [ ] 5.3 工具栏：Create、Delete、Export、Submit、Withdraw，按资格规则启用
- [ ] 5.4 表格：规定列、status 徽章、Actions 列 sticky、行 nowrap；按 status 显示 Edit 或 Details
- [ ] 5.5 集成 TablePagination、ExportModal、ApprovalLogModal、ConfirmDialog（Delete、Submit、Withdraw、离开向导）

## 6. 导出、i18n 与注册

- [ ] 6.1 创建 `exportCourseChangeApplicationExcel.js`：列表 field 定义
- [ ] 6.2 补充 i18n：Change Description、Basic Information、Major/Minor 标签、MAIN/OTHER COMPONENTS、Withdraw、变更组件说明、确认文案
- [ ] 6.3 在 `App.vue` 注册 `CourseChangeApplicationView`；`developedPages` 加入 `course-change-application`

## 7. 回写 Helper 与验证

- [ ] 7.1 在数据层导出 `applyApprovedChangeToCourse`（申请端无 Approval UI）；文档说明供 Course Change Review 集成
- [ ] 7.2 冒烟：Create → Choose 基线 → Course Code 只读 → Save draft → Edit → Submit（含确认）
- [ ] 7.3 冒烟：Withdraw In Progress → Temporary saved；Delete draft；Rejected 行无 Edit/Submit/Withdraw
- [ ] 7.4 冒烟：直接调用 helper → Course Information 展示更新数据 + changeRecords
- [ ] 7.5 运行 `npm run build`
