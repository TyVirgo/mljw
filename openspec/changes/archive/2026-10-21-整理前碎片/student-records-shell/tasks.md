# 学籍管理-应用壳层与导航 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-student-records-app

```
## 1. i18n 与门户

- [x] 1.1 更新 `src/i18n/locales/zh.js`：门户 `portal.apps.studentRecords`、模块 `menu.studentRecords`、6 个菜单项 `menu.sr*`、Student Profile 页面 `studentProfile.*` 文案
- [x] 1.2 更新 `src/i18n/locales/en.js`：同步英文（Student Status Management、Student Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal 等）

## 2. 菜单配置

- [x] 2.1 创建 `src/config/studentRecordsMenu.js`：扁平 6 项菜单、`studentRecordsDevelopedPages`（含 `sr-student-profile`）、模块 key、面包屑辅助函数
- [x] 2.2 提取或复用 `buildMenuBreadcrumbKeys` 逻辑，使 `PageBreadcrumb` 可传入自定义 `moduleKey` 与 `menuItems`

## 3. 共享组件参数化

- [x] 3.1 为 `Sidebar.vue` 增加 `items`、`defaultExpandedGroups` props（默认值保持现有基础数据行为）
- [x] 3.2 为 `PageBreadcrumb.vue` 增加 `moduleKey`、`menuItems` props，并接入通用面包屑构建函数

## 4. Mock 数据与导出

- [x] 4.1 创建 `src/data/students.js`：`initialStudents`（≥6 条）、`studentTypeOptions`、`genderOptions`、`studentStatusOptions`、`createStudentId`、`normalizeStudent`
- [x] 4.2 创建 `src/utils/exportStudentProfileExcel.js`：列表导出列 field 定义，对齐表格列

## 5. Student Profile 列表页

- [x] 5.1 创建 `src/views/studentRecords/StudentProfileView.vue`：搜索栏（Student ID、Name、Student Type）、Search/Reset
- [x] 5.2 实现工具栏：Create（占位提示）、Import（占位提示）、Export（ExportModal）
- [x] 5.3 实现数据表格：原型列顺序、行号、Actions（Details、Edit）
- [x] 5.4 集成 `TablePagination`、`useListPageI18n`；样式从 `LecturerInformationView.vue` adapt（`.page-card`、`.search-bar`、`.toolbar`、`.data-table`）
- [x] 5.5 创建 `StudentProfileDetailModal.vue`（或内联 modal）：Details 只读展示；Edit 首版占位提示

## 6. 门户入口

- [x] 6.1 修改 `AcademicPortalVi
```

### restructure-student-records-navigation

```
## 1. i18n 菜单与 Tab 文案

- [x] 1.1 更新 `zh.js` / `en.js`：新增 3 分组 + 9 二级菜单 key；`menu.srStudentBasicInfo`（学生基本信息）；移除侧边栏对 `srFamilyInfo` 的引用
- [x] 1.2 新增 `movementApplication.tabs.*` 或复用现有四异动 menu key 作为 Tab 标签
- [x] 1.3 更新 `zh-flat.js`：如有新增 flat 映射则同步（无新增 flat 文案，跳过）

## 2. 菜单配置

- [x] 2.1 重写 `studentRecordsMenu.js`：3 个 `children` 分组结构；新增 `sr-movement-*`、`sr-personal-curriculum` pageId
- [x] 2.2 更新 `studentRecordsDevelopedPages`：`sr-student-profile`、`sr-movement-application`
- [x] 2.3 移除 `sr-family-info`、`sr-programme-transfer`、`sr-deferment`、`sr-resumption`、`sr-withdrawal` 独立 sidebar 项

## 3. Tab 壳层组件

- [x] 3.1 创建 `StudentMovementApplicationView.vue`：水平 Tab 条 + 四 Tab 切换
- [x] 3.2 嵌入 `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`（`v-show` 保持状态）
- [x] 3.3 默认 Tab = `deferment`；Tab 激活态样式（下划线，对齐图2）
- [x] 3.4 （可选）为四 View 增加 `embedded` prop，微调 Tab 内 padding/高度（通过壳层 `:deep()` 微调，未改四 View）

## 4. App 壳层集成

- [x] 4.1 更新 `App.vue`：注册 `StudentMovementApplicationView`；移除四异动独立 `v-if` 分支
- [x] 4.2 传入 Sidebar `defaultExpandedGroups`：`['sr-mgmt-group', 'sr-movement-group', 'sr-study-plan-group']`
- [x] 4.3 确认 `UnderConstructionView` 对未开发二级菜单正常工作；Back 仍回 `sr-student-profile`

## 5. 面包屑与 Sidebar 行为

- [x] 5.1 验证分组菜单 expand/collapse、子项 active 高亮与 Basic Data 一致
- [x] 5.2 验证面包屑：`学籍管理 > 学生基本信息`、`学籍异动 > 学籍异动申请`（`buildStudentRecordsBreadcrumbKeys` 定制）

## 6. 验证

- [x] 6.1 冒烟：门户进入 → 默认学生基本信息；侧边栏无 Family Info / 无四异动独立项
- [x] 6.2 冒烟：学籍异动申请 → 四 Tab 切换；各 Tab 内 Create/Edit/Approve/C
```

### unify-application-detail-drawer

```
## 1. 基础组件

- [x] 1.1 新建 `src/utils/buildApprovalTimelineNodes.js`：workflowStages + approvalLog + currentStage + status → timeline nodes
- [x] 1.2 新建 `src/components/common/ApprovalTimeline.vue`：竖向时间线 UI（图标、阶段、处理人、状态徽章、时间、comment 可选）
- [x] 1.3 新建 `src/components/common/ApplicationDetailDrawer.vue`：右滑壳（header / scroll-body / footer slot）；参考 `StudentProfileDetailDrawer`
- [x] 1.4 i18n：`approvalTimeline.*` 状态徽章；时间线区标题；确认「详情」按钮文案统一

## 2. 异动详情内容拆分

- [x] 2.1 从 `DefermentDetailModal.vue` 拆出 `DefermentDetailContent.vue`（无 overlay/footer）— 已用 `MovementDetailContent.vue` 统一替代
- [x] 2.2 从 `ProgrammeTransferDetailModal.vue` 拆出 `ProgrammeTransferDetailContent.vue` — 同上
- [x] 2.3 从 `ResumptionDetailModal.vue` 拆出 `ResumptionDetailContent.vue` — 同上
- [x] 2.4 从 `WithdrawalDetailModal.vue` 拆出 `WithdrawalDetailContent.vue` — 同上
- [x] 2.5 新建 `MovementApplicationDetailDrawer.vue`：组装 timeline + 四类 DetailContent + footer（Close / Review / Recall）
- [x] 2.6 透传 `maskSensitiveFields`、`showApprovalAction` 等现有 props

## 3. 管理端异动 — 查询试点

- [x] 3.1 `MovementQueryView.vue`：Details + Approval Log → 单一 Details；接入 `MovementApplicationDetailDrawer`
- [x] 3.2 移除 `viewMode === 'review'` 整页 `MovementApprovalReviewView` 分支
- [x] 3.3 移除 `ApprovalLogModal` 引用；`:mask-sensitive-fields="true"`

## 4. 管理端异动 — 审批

- [x] 4.1 `MovementApprovalView.vue`：View + Approval Log → Details 抽屉
- [x] 4.2 Pending tab footer Review → `MovementApprovalModal`；History tab Recall
- [x] 4.3 移除整页 ReviewView 与独立 ApprovalLogModal

## 5. 管理端异
```
