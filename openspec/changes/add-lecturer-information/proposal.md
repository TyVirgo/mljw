## 背景与动机

Lecturer Info → Lecturer Information 菜单目前指向「建设中」占位页，无法管理教职工基本信息。该模块是 Basic Data 的核心功能之一，需要尽快提供与原型一致的列表、检索、增删改查及详情展示能力，以支撑教务系统对教师资源的统一管理。

## 变更内容

- 新增 **Lecturer Information** 主页面：列表展示、分页、批量选择、搜索/重置、More 展开高级筛选
- 新增 **Create / Edit** 四步向导弹窗：
  1. Personal Information + Employment Information + Others（基本信息与附件）
  2. Academic Qualifications（可增删多条学历记录，含附件）
  3. Working Experience（可增删多条工作经历）
  4. Continuous Professional Development (CPD)（按年度分组展示，详情只读）
- 新增 **Details** 四步详情弹窗，结构与 Create 对应，只读展示
- 新增本地 mock 数据层与导出工具，沿用现有 Department / Classroom 页面模式
- 将 `lecturer-information` 加入 `developedPages`，并在 `App.vue` 注册路由视图
- 工具栏按钮：Create、Delete、Export、Sync Cache、Refers to EMS system（后两者先做 UI 占位 + 提示）
- 列表支持「Requires Evaluation」标签及「Filter lecturers who require teaching observation/lecture evaluation」开关筛选
- CPD 数据在本阶段使用 mock 数据；接口对接（人事系统、教师个人端审批）留作后续集成
- **不新增** Senate Unit Members Management 子菜单（Lecturer Info 保持现有两项子菜单）

## 能力范围

### 新增能力

- `lecturer-information`: 教师信息管理全流程——列表检索、CRUD、四步 Create/Edit 向导、四步 Details 详情、导出、批量删除、评价筛选标签

### 修改的能力

（无现有 spec，留空）

## 影响范围

- **新增文件**
  - `src/views/LecturerInformationView.vue`
  - `src/components/lecturer/LecturerFormModal.vue`（四步向导）
  - `src/components/lecturer/LecturerDetailModal.vue`（四步详情）
  - `src/components/lecturer/QualificationCard.vue` / `WorkingExperienceCard.vue`（子卡片，按需拆分）
  - `src/data/lecturers.js`
  - `src/utils/exportLecturerExcel.js`
- **修改文件**
  - `src/App.vue` — 注册视图
  - `src/config/menu.js` — `developedPages` 加入 `lecturer-information`
- **复用组件**
  - `ConfirmDialog`、`ExportModal`、`TablePagination`、`DatePickerEn`
- **无后端依赖**：首版基于前端 mock，CPD 同步/EMS 对接为占位
