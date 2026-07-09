## 背景与动机

教学门户中「学籍管理 / Student Status Management」卡片当前标记为待开发，点击后仅展示建设中占位页。学籍管理是教务核心模块，需与「基础数据」并列作为门户二级应用；首版应提供与原型一致的**侧边栏菜单骨架**、**Basic Data 同款 Admin Shell**，并实现 **Student Profile（学生档案）** 列表页作为首个可演示业务页面，其余菜单项暂为应用内建设中页。

## 变更内容

- 门户卡片：`student-records` 标记为已开发，点击后进入学籍管理应用壳层（不再跳转门户内建设中页）
- 新增 **学籍管理应用** 独立 Admin Shell：顶栏模块标题、侧边栏、面包屑、返回门户；布局与样式对齐现有「基础数据」应用（复用 `HeaderBar` / `Sidebar` / `PageBreadcrumb` / 列表页 card 样式）
- 新增 `src/config/studentRecordsMenu.js`：学籍应用专属菜单，**扁平 6 项**（对齐原型图示）：
  1. **Student Profile**（学生档案）— 首版已开发
  2. Family Info（家庭信息）
  3. Programme Transfer（转专业）
  4. Deferment（休学）
  5. Resumption（复学）
  6. Withdrawal（退学）
- 新增 **Student Profile Management** 列表页：搜索（Student ID、Name、Student Type）、Create / Import（占位）/ Export、分页表格、Details / Edit 操作；列与原型一致（No.、Student ID、Student Name、Chinese Name、Student Type、Gender、Programme Code、Programme、Intake、Student Status、Actions）
- 新增本地 mock 数据层（≥6 条样例）与 Excel 导出工具，模式对齐 `LecturerInformationView` / `lecturers.js`
- 扩展 `App.vue`：`appView` 增加 `student-records` 模式；默认 landing 为 `sr-student-profile`
- 补充 i18n：门户文案、模块标题、菜单项、Student Profile 页面文案

### 非目标（本变更不做）

- Family Info、Programme Transfer、Deferment、Resumption、Withdrawal 的业务 CRUD（仅菜单 + 建设中页）
- Student Profile 的 Create/Edit 多步向导或完整表单（首版列表 + Details/Edit 入口可先以弹窗占位或只读详情，见 design.md）
- 后端 API 对接、Import 真实逻辑、审批流
- 与基础数据菜单合并（学籍应用保持独立 `studentRecordsMenu.js`）
- Dashboard 首页（原型侧边栏无 Dashboard，默认直接进入 Student Profile）

## 能力范围

### 新增能力

- `student-records-app`: 学籍管理应用壳层——门户入口、独立 Admin Shell、扁平菜单骨架、应用内建设中页路由
- `student-profile`: 学生档案列表页——检索、分页、批量选择、Create/Export、Details/Edit 入口、mock 数据

### 修改的能力

（无现有 main spec，留空）

## 影响范围

- **新增文件**
  - `src/config/studentRecordsMenu.js` — 学籍应用菜单与 `developedPages`
  - `src/views/studentRecords/StudentProfileView.vue` — 学生档案列表页
  - `src/data/students.js` — mock 数据、枚举、校验辅助
  - `src/utils/exportStudentProfileExcel.js` — 导出列定义
  - `src/i18n` 中学籍模块与 Student Profile 相关 key
- **修改文件**
  - `src/views/AcademicPortalView.vue` — 门户卡片 `developed: true`，emit 打开学籍应用
  - `src/App.vue` — 注册 `appView === 'student-records'` 分支与 Student Profile 视图
  - `src/components/Sidebar.vue` / `PageBreadcrumb.vue`（参数化 menu 配置，最小改动）
  - `src/i18n/locales/zh.js`、`src/i18n/locales/en.js`
- **复用**
  - `HeaderBar`、`UnderConstructionView`、`ConfirmDialog`、`ExportModal`、`TablePagination`、`useListPageI18n`
  - Basic Data 列表页 scoped CSS 模式（`.page-card`、`.search-bar`、`.toolbar`、`.data-table`）
- **无后端依赖**：首版纯前端 mock
