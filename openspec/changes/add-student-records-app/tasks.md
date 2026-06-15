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

- [x] 6.1 修改 `AcademicPortalView.vue`：`student-records` 设 `developed: true`，点击 emit `open-student-records`
- [x] 6.2 在 `App.vue` 监听 `open-student-records`，设置 `appView = 'student-records'` 且 `currentPageId = 'sr-student-profile'`

## 7. App 壳层集成

- [x] 7.1 在 `App.vue` 新增 `student-records` 布局分支：复用 `HeaderBar`（`titleKey=studentRecordsModuleKey`）、参数化 `Sidebar` / `PageBreadcrumb`
- [x] 7.2 注册 `StudentProfileView`；未在 `studentRecordsDevelopedPages` 的 pageId 显示 `UnderConstructionView`，Back 回 `sr-student-profile`
- [x] 7.3 实现返回门户：学籍分支下重置 `appView` 为 `portal`

## 8. 验证

- [x] 8.1 手动冒烟：门户进入学籍应用 → 默认 Student Profile 列表 → 搜索/Export/Details → 切换其余 5 项菜单见建设中 → 返回门户 → 基础数据不受影响
- [x] 8.2 视觉对比：学籍侧边栏与列表页样式与 Basic Data（如 Lecturer Information）一致
