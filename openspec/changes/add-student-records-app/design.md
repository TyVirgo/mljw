## 背景说明

当前 `App.vue` 通过 `appView`（`portal` | `admin`）切换门户与「基础数据」管理壳层。门户中 `student-records` 卡片 `developed: false`，点击后停留在 `AcademicPortalView` 内部的建设中页。

Basic Data 列表页（如 `LecturerInformationView.vue`）已形成稳定模式：`page-card` 容器、搜索栏 + Search/Reset、工具栏（Create / Delete / Export）、`data-table` + `TablePagination`、Modal 弹窗 CRUD。学籍管理需成为第二个门户应用，**视觉与交互与 Basic Data 保持一致**，菜单结构对齐用户提供的 StudentSys 原型（扁平 6 项侧边栏）。

## 目标 / 非目标

**目标：**

- 门户卡片可点击，进入独立 Admin Shell（Header + Sidebar + Breadcrumb + Main）
- 侧边栏 6 项扁平菜单（Student Profile 为首项且默认 landing）
- Student Profile 列表页完整可演示（搜索、表格、分页、Export；Create/Import 至少 UI 可达）
- 复用 Basic Data 布局组件与列表页 CSS 约定

**非目标：**

- 其余 5 个菜单项的业务实现
- Student Profile 完整多步 Create/Edit 向导（首版可 Details 只读 + Edit 占位提示）
- 真实 API / 权限 / 审批流
- vue-router 引入
- Dashboard 首页

## 设计决策

### 1. 应用视图模式 — 扩展 `appView` 枚举

```
appView: 'portal' | 'admin' | 'student-records'
```

- `admin`：现有基础数据，行为不变
- `student-records`：学籍应用，使用 `studentRecordsMenu.js`

**默认 landing**：`sr-student-profile`（非 Dashboard）

### 2. 菜单配置 — `src/config/studentRecordsMenu.js`

扁平菜单（无分组），对齐原型：

| pageId | 英文 | 中文 | 首版状态 |
|--------|------|------|----------|
| `sr-student-profile` | Student Profile | 学生档案 | ✓ 已开发 |
| `sr-family-info` | Family Info | 家庭信息 | 建设中 |
| `sr-programme-transfer` | Programme Transfer | 转专业 | 建设中 |
| `sr-resumption` | Resumption | 复学 | 建设中 |
| `sr-deferment` | Deferment | 休学 | 建设中 |
| `sr-withdrawal` | Withdrawal | 退学 | 建设中 |

导出：

| 导出项 | 说明 |
|--------|------|
| `studentRecordsModuleKey` | 顶栏/面包屑模块名 i18n key |
| `studentRecordsMenuItems` | 侧边栏扁平项（每项带 icon，参考 Basic Data 一级菜单 icon 风格） |
| `studentRecordsDevelopedPages` | `Set`，首版含 `'sr-student-profile'` |
| 面包屑辅助函数 | 与 `menu.js` 同模式 |

**相对旧版设计的变更**：移除 Dashboard 与 Student Info / Registration 分组占位，改为原型扁平 6 项。

### 3. 样式对齐 Basic Data

```
┌──────────────────────────────────────────────────────────────┐
│ HeaderBar（模块标题 + 返回门户 + 用户区）                      │
├──────────┬───────────────────────────────────────────────────┤
│ Sidebar  │ PageBreadcrumb                                    │
│ 260px    ├───────────────────────────────────────────────────┤
│ 白底     │ .page-card                                        │
│ #2563eb  │   .search-bar  → Search / Reset                   │
│ 激活态   │   .toolbar     → Create / Import / Export         │
│          │   .data-table  → 斑马纹表格 + Actions               │
│          │   TablePagination                                 │
└──────────┴───────────────────────────────────────────────────┘
```

- **不新建**独立主题变量；直接复用 `Sidebar.vue` 现有 scoped 样式（`#dbeafe` 激活、`#2563eb` 主色）
- Student Profile 页面 CSS 从 `LecturerInformationView.vue` 复制/adapt（`.page-card`、`.search-bar`、`.toolbar`、`.data-table`、按钮 class）
- 门户卡片图标沿用 `AcademicPortalView` 现有 `student` icon

### 4. 共享组件 — Sidebar / PageBreadcrumb 参数化

与旧设计一致：

- **Sidebar.vue**：`items`、`defaultExpandedGroups` props（学籍菜单无 children，`defaultExpandedGroups` 为空）
- **PageBreadcrumb.vue**：`moduleKey`、`menuItems` props

### 5. Student Profile 列表页

**文件**：`src/views/studentRecords/StudentProfileView.vue`

**搜索区**（首行，对齐原型）：

| 字段 | 类型 |
|------|------|
| Student ID | text |
| Name | text |
| Student Type | select（含 All Categories / 全部） |

**工具栏**：

| 按钮 | 行为 |
|------|------|
| Create | 首版：`window.alert` 或 notice 占位「表单开发中」；保留按钮与样式 |
| Import | UI 占位提示（同 Course Application Import 模式） |
| Export | 复用 `ExportModal` + `exportStudentProfileExcel.js` |

**表格列**（顺序对齐原型）：

No. · Student ID · Student Name · Chinese Name · Student Type · Gender · Programme Code · Programme · Intake · Student Status · Actions（Details · Edit）

**Actions**：

- **Details**：首版只读弹窗（`StudentProfileDetailModal.vue` 或内联 modal），展示行内字段
- **Edit**：首版占位提示或打开与 Details 相同只读 modal 并标注「Edit 表单后续迭代」

**数据层**：`src/data/students.js`

- 枚举：`studentTypeOptions`、`genderOptions`、`studentStatusOptions`
- Programme / Intake 可从现有 `programme*` mock 取常用值或硬编码样例
- ≥6 条 mock，含 Active 等状态
- helpers：`createStudentId`、`normalizeStudent`、`initialStudents`

### 6. 门户入口

```javascript
// AcademicPortalView.vue
{ id: 'student-records', developed: true, ... }
emit('open-student-records')

// App.vue
function openStudentRecordsApp() {
  appView.value = 'student-records'
  currentPageId.value = 'sr-student-profile'
}
```

门户文案保持现有 i18n：`Student Status Management` / `学籍管理`（不强制改为 Student Records Application）。

### 7. i18n 命名空间

| Key 前缀 | 用途 |
|----------|------|
| `portal.apps.studentRecords` | 门户卡片 |
| `menu.studentRecords` | 模块根标题 |
| `menu.srStudentProfile` 等 | 6 个菜单项 |
| `studentProfile.*` | 列表页搜索、列头、按钮、占位提示 |

## 风险与应对

| 风险 | 缓解 |
|------|------|
| Create/Edit 未完整实现，演示体验不完整 | Details 只读弹窗保证可点通；proposal 明确为非目标 |
| 扁平菜单后续可能需分组 | pageId 前缀 `sr-` 保留扩展空间；变更菜单仅改 config |
| `App.vue` 分支膨胀 | 学籍分支仅 StudentProfile + UnderConstruction |
| Programme/Intake 与基础数据 mock 不一致 | students.js 引用 programme 名称字符串，不强制 FK |

## 迁移说明

纯前端增量：

1. 门户点击「学籍管理」→ 默认 Student Profile 列表
2. 切换其余 5 项菜单 → 应用内建设中页 → Back 回 Student Profile
3. 返回门户与基础数据互不影响

## 待定问题

1. Student Profile **Create/Edit 完整表单**是否紧接本变更做第二个 OpenSpec？（建议 yes，本变更仅列表 + 只读 Details）
2. **Delete** 是否纳入首版？（原型未展示 Delete；建议首版不含 Delete，与图示一致）

## 已确认

- 菜单采用原型**扁平 6 项**，移除 Dashboard（2026-06-12，用户图示确认）
- 样式与 **Basic Data 列表页**保持一致，不单独做 StudentSys 主题（2026-06-12）
- 默认 landing 为 **Student Profile**（2026-06-12）
