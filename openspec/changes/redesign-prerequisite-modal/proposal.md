## Why

Course Information / Course Application 向导中 **Pre-requisite / co-requisite** 的 **Choose** 按钮当前打开简化的 `CoursePrerequisiteModal`（仅 Course Code / Course Name 两行检索 + 三列表格），与产品原型差距较大。原型要求 **Add** 弹窗具备完整检索区、宽表格（含 Offering、Credit Value、课程性质）、分页与 Discard / Confirm 底栏，便于用户在大量课程中精确挑选先修课。

## What Changes

- **重构** `CoursePrerequisiteModal.vue`，严格对齐原型 **Add** 弹窗布局与交互
- **检索区**（第一行三列 + 右侧按钮）：
  - Course Name、Course Code、Offering（下拉，复用 `getOfferingOptions`）
  - **Search**（应用筛选）、**Reset**（清空并恢复全量）
- **数据表格**（宽弹窗，建议 `max-width: 960px`～`1100px`）：
  - 列：复选框（含表头全选/半选）、No.、Course code、Course Name、Offering、Credit Value、Course Classification（原型「课程性质」）
  - 行可多选；排除当前编辑课程（`excludeCode`）
- **分页**：复用 `TablePagination`（Total records、Home/Prev/Next/End、page size、Jump to page）
- **底栏**：**Discard**（关闭不保存）、**Confirm**（回写选中课程 code，逗号分隔，与现逻辑一致）
- **标题**：弹窗标题为 **Add**（非 Pre-requisite / co-requisite 长标题）
- 继续由 `CourseCreateWizard` 与 `CourseApplicationWizard` 传入 `courses` 列表；Offering 列用 `getOfferingLabel` 展示
- 补充 i18n：`Discard`、弹窗标题 `Add`（若缺失）

## Capabilities

### New Capabilities

- `prerequisite-course-modal`: 先修/同修课程选择弹窗——检索、分页表格、多选、确认回写

### Modified Capabilities

（无现有 spec，留空）

## Impact

- **修改文件**
  - `src/components/course/CoursePrerequisiteModal.vue` — 全面重写 UI/交互
  - `src/i18n/zh-flat.js`（及 `locales` 若需要）— Discard、Add 等文案
- **复用**
  - `TablePagination`、`getOfferingOptions`、`getOfferingLabel`（`courses.js` + `departments.js`）
  - `useAppI18n`
- **无 API 变更**：仍为前端 mock 课程列表过滤与分页
- **调用方**：`CourseCreateWizard.vue`、`CourseApplicationWizard.vue` props/emit 保持不变（`courses`, `selectedCodes`, `excludeCode`, `@confirm`）

## Out of Scope

- 先修课关系校验（环检测、学分限制）
- 与后端课程目录 API 对接
- 弹窗内 Export / Import
