# 基础数据-课程信息与开课申请 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-course-application

```
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

- [ ] 4.1 创建 `GeneralInformationStep.vue`：**双列 grid**、可滚动；字段来自 
```

### add-course-change-application

```
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
- [ ] 4.3 Step 3：CLO 表格 + `CourseCLOFormModal`；Step 4：`CourseSLTSte
```

### add-new-course-approval

```
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
- [ ] 4.2 实现 Approved 路径：阶段推进；Senate 终审 → status Approved +
```

### align-change-description-step-ui

```
## 1. 数据层

- [x] 1.1 扩展 `courseChangeApplications.js` 中 `changeDescriptionComponents`：将全部 10 个组件的 `hint` 替换为 `majorCriteria[]`、`minorCriteria[]`（文案取自原型）
- [x] 1.2 确认 `createEmptyChangeDescription()` 默认值与校验逻辑不变

## 2. 切换组件

- [x] 2.1 新建 `ChangeLevelToggle.vue`：胶囊形 N/Y 开关，props `active` / `disabled`，激活态蓝色（#2563eb）
- [x] 2.2 支持只读模式（disabled，无 pointer events）

## 3. ChangeDescriptionStep 重构

- [x] 3.1 重写模板为三列表格：表头行 + 数据行（Component Name | Major Changes | Minor / No Changes）
- [x] 3.2 在各列切换下方以 bullet 列表渲染 `majorCriteria` / `minorCriteria`
- [x] 3.3 互斥切换逻辑：点击未激活列 → 设为 `major` 或 `minor`
- [x] 3.4 区块标题增加蓝色竖向强调条（MAIN COMPONENTS / OTHER COMPONENTS）
- [x] 3.5 表格样式：行边框、组件名列 `#fafafa` 背景、12px 灰色 criteria 文案

## 4. i18n

- [x] 4.1 在 `zh-flat.js` 为全部 criteria bullet 补充中文（10 组件 × major + minor 列表）
- [x] 4.2 补全表头 key：`Component Name`、`Major Changes`、`Minor / No Changes`

## 5. 验证

- [x] 5.1 视觉检查：Step 1 对齐原型布局（三列、胶囊切换、bullet criteria）
- [x] 5.2 功能检查：切换互斥、默认 minor、只读详情模式
- [x] 5.3 运行 `npm run build`
```

### polish-course-library-import-footer

```
## 1. 页脚对齐

- [x] 1.1 更新 proposal / design / spec / tasks
- [x] 1.2 `CourseLibraryImportModal`：footer-pagination + footer-actions；补齐按钮与分页 :deep 样式
```

### polish-course-list-pager-filter

```
## 1. 实现

- [x] 1.1 先修未修读/不及格原因 + demo
- [x] 1.2 感叹号 tip；学分漏斗
- [x] 1.3 分页与扩充课程 demo
```

### redesign-prerequisite-modal

```
## 1. Modal 壳层与布局

- [ ] 1.1 重写 `CoursePrerequisiteModal.vue` 面板：标题 **Add**，`max-width: 1000px`，flex 列布局（header / body / footer）
- [ ] 1.2 样式：标题 16px、× 关闭；底栏 **Discard** + **Confirm**，按钮圆角 8px，对齐原型
- [ ] 1.3 遮罩、×、Discard 均 `emit('close')`，不持久化选择

## 2. 搜索区

- [ ] 2.1 新增搜索行：Course Name、Course Code、Offering（下拉，来自 `getOfferingOptions(initialDepartments)`）
- [ ] 2.2 实现 draft 与 applied 搜索状态；**Search** 应用筛选并重置页码为 1；**Reset** 清空两者
- [ ] 2.3 布局：一行三字段 + 右侧 Search/Reset；标签左对齐、紧凑间距（对齐列表页搜索样式）
- [ ] 2.4 客户端筛选：name/code 部分匹配；offering 精确匹配；排除 `excludeCode`

## 3. 数据表格

- [ ] 3.1 渲染列：checkbox、No.、Course code、Course Name、Offering、Credit Value、Course Classification
- [ ] 3.2 Offering 列使用 `getOfferingLabel`；Classification 使用 `tr(course.courseClassification)`；缺失值显示 `--`
- [ ] 3.3 多选 `checkedCodes`；表头全选/半选仅作用于**当前页**
- [ ] 3.4 跨页选择保留；空态 `common.noData`
- [ ] 3.5 表格 body 在 Modal 内可滚动；窄屏时表格横向滚动

## 4. 分页

- [ ] 4.1 表格下方集成 `TablePagination`（`total = filtered.length`，默认 pageSize 10）
- [ ] 4.2 对筛选结果分页后再渲染；No. 按页偏移计算

## 5. Confirm 与集成

- [ ] 5.1 Confirm 时 `emit('checkedCodes.join(', ')')` 后关闭
- [ ] 5.2 打开时：从 `selectedCodes` 恢复选中，重置搜索字段
- [ ] 5.3 规范化来自 `courses` 与 application 载荷的课程行（确保 code/name/offering/credit/classification 可用）
- [ ] 5.4 冒烟：Course Information 向导 Choose 流程；Course Application 向导 Choose 流程

## 6. i18n

- [ ] 6.1 在 `zh-flat.js` / locales 补充 `Discard` → 放弃（或按产品用取消）及 `Add` 标题 key（若缺失）
- [ ] 6.2 复用现有 key：Search、Reset、Course Name、Course Code、Offering、Credit Value、Course Classification、Confi
```

### refine-approval-modal-action-labels

```
## 1. i18n

- [x] 1.1 `zh.js` / `en.js` 新增 `approvalModal.action.approved|rejected|updateRequired`
- [x] 1.2 确认 **不修改** `zh-flat.js` 中全局 `Approved` / `Rejected`（保护状态筛选与徽章）

## 2. 公共 helper（推荐）

- [x] 2.1 新增 `getApprovalActionLabel(action, t)`（或 composable），映射三档 action → i18n key
- [x] 2.2 单元/手工：三 action 值返回预期中文

## 3. 异动审核弹框

- [x] 3.1 `MovementApprovalModal.vue`：Action 单选改用 `getApprovalActionLabel(opt)` 替代 `tr(opt)`

## 4. 课程审核弹框

- [x] 4.1 `CourseApprovalModal.vue`：同上

## 5. 验证

- [x] 5.1 学籍异动审批：Pending → Approve/Review → 弹框三选项为 通过 / 不通过 / 驳回
- [x] 5.2 新课程审批、课程变更审批：同上
- [x] 5.3 详情抽屉 footer Review：同上
- [x] 5.4 回归：列表 Status 徽章仍为 已通过/已驳回 等（未误改）
- [x] 5.5 回归：选 不通过 / 驳回 仍要求 Comments；选 通过 按原规则
- [x] 5.6 Node 18+ `npm run build` 通过
```

### refine-course-list-status-ux

```
## 1. 实现

- [x] 1.1 名额/选课状态列拆分与操作区
- [x] 1.2 学分表头筛选
- [x] 1.3 去掉整行置灰；原因文案；i18n
```
