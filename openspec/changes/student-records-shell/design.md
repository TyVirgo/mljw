# 学籍管理-应用壳层与导航 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-student-records-app

## 背景说明

当前 `App.vue` 通过 `appView`（`portal` | `admin`）切换门户与「基础数据」管理壳层。门户中 `student-records` 卡片 `developed: false`，点击后停留在 `AcademicPortalView` 内部的建设中页。

Basic Data 列表页（如 `LecturerInformationView.vue`）已形成稳定模式：`page-card` 容器、搜索栏 + Search/Reset、工具栏（Create / Delete / Export）、`data-table` + `TablePagination`、Modal 弹窗 CRUD。学籍管理需成为第二个门户应用，**视觉与交互与 Basic Data 保持一致**，菜单结构对齐用户提供的 StudentSys 原型（扁平 6 项侧边栏）。

## 目标 / 非目标

**目标：**

- 门户卡片可点击，进入独立 管理员Shell（Header + Sidebar + Breadcrumb + Main）
- 侧边栏 6 项扁平菜单（学生Profile 为首项且默认 landing）
- 学生Profile 列表页完整可演示（搜索、表格、分页、Export；Create/Import 至少 UI 可达）
- 复用 Basic Data 布局组件与列表页 CSS 约定

**非目标：**

- 其余 5 个菜单项的业务实现
- 学生Profile 完整多步 Create/Edit 向导（首版可 Details 只读 + Edit 占位提示）
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
| `sr-student-profile` | 学生Profile | 学生档案 | ✓ 已开发 |
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

**相对旧版设计的变更**：移除 Dashboard 与 学生Info / Registration 分组占位，改为原型扁平 6 项。

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

- 

## 来源：restructure-student-records-navigation

## 背景说明

`add-student-records-app` 交付扁平 6 项侧边栏；后续 `add-programme-transfer-app`、`add-deferment-app`、`add-resumption-app`、`add-withdrawal-app` 已将四异动实现为独立 sidebar 页面。

产品目录（图1）要求：
- **学籍管理** / **学籍异动** 两个一级模块（§8 起移除「学生个人学习计划」）
- 四异动属于 **学籍异动申请** 二级页内的 Tab（图2 红框）

现有技术栈：`App.vue` 用 `currentPageId` + `v-if` 切换；`Sidebar.vue` 已支持 `{ children: [] }` 分组（Basic Data 模式）；`menuBreadcrumb.js` 支持 **一层 parent + leaf** 面包屑。

## 目标 / 非目标

**目标：**

- **2 分组**侧边栏 IA（学籍管理 + 学籍异动；§8 移除学生个人学习计划）
- 「学籍异动申请」Tab 壳层嵌入四异动 View（薄壳）
- 移除 Family Info；学生档案改名为学生基本信息
- 默认 landing 仍为 `sr-student-basic-info`（或保留 id `sr-student-profile` 仅改 label，见 Decision 2）
- 未开发二级菜单走 `UnderConstructionView`
- 中英文 i18n 同步

**非目标：**

- 图2 统一列表 + 批量送审
- 保留入学资格 / 其它异动 Tab
- 异动审批会签等业务
- vue-router
- 修改四异动 data / modal 业务逻辑
- **学生个人培养方案**菜单（§8 整组移除）

## 设计决策

### 1. 侧边栏结构 — `studentRecordsMenu.js`

```javascript
export const studentRecordsMenuItems = [
  {
    id: 'sr-mgmt-group',
    labelKey: 'menu.srManagementGroup',
    icon: 'user',
    children: [
      { id: 'sr-student-profile', labelKey: 'menu.srStudentBasicInfo' },
    ],
  },
  {
    id: 'sr-movement-group',
    labelKey: 'menu.srMovementGroup',
    icon: 'transfer',
    children: [
      { id: 'sr-movement-category', labelKey: 'menu.srMovementCategory' },
      { id: 'sr-consent-form', labelKey: 'menu.srConsentForm' },
      { id: 'sr-movement-application', labelKey: 'menu.srMovementApplication' },
      { id: 'sr-movement-approval', labelKey: 'menu.srMovementApproval' },
      { id: 'sr-movement-maintenance', labelKey: 'menu.srMovementMaintenance' },
      { id: 'sr-movement-query', labelKey: 'menu.srMovementQuery' },
    ],
  },
]
```

**§8 变更：** 删除原 `sr-study-plan-group` 整组及 `sr-personal-curriculum` 子项。

**`studentRecordsDevelopedPages`**（首版）：

```javascript
new Set(['sr-student-profile', 'sr-movement-application'])
```

**`defaultExpandedGroups`**（App.vue 传入 Sidebar）：

```javascript
['sr-mgmt-group', 'sr-movement-group']
```

**§8：** 不再默认展开 `sr-study-plan-group`。

### 2. pageId 保留策略

| 决策 | 说明 |
|------|------|
| 保留 `sr-student-profile` | 避免 StudentProfileView 与 OpenSpec 历史 id 大面积重命名；**仅改 i18n 展示**为「学生基本信息」 |
| 新增 `sr-movement-application` | Tab 壳层唯一 sidebar 入口 |
| 移除 sidebar 中的 `sr-family-info`、`sr-programme-transfer`、`sr-deferment`、`sr-resumption`、`sr-withdrawal` | 四异动仅通过 Tab 访问 |

### 3. Tab 壳层 — `StudentMovementApplicationView.vue`

```
┌─────────────────────────────────────────────────────────┐
│  .movement-tabs（水平 Tab，图2 红框样式）              

## 来源：unify-application-detail-drawer

## 背景说明

当前详情与日志分离，容器形态不统一：

```
┌─────────────────────────────────────────────────────────────────┐
│  现状                                                            │
├─────────────────────────────────────────────────────────────────┤
│  学生端 4 View     [详情 Modal]  +  [流转日志 Modal]              │
│  管理 Query/Maint  整页 ReviewView +  [Approval Log Modal]        │
│  管理 Approval     整页 ReviewView +  [Approval Log Modal]        │
│  课程 4 View       [Details Modal] +  [Approval Log Modal]        │
│  日志展示          ApprovalLogModal — 5 列表格                     │
└─────────────────────────────────────────────────────────────────┘
```

目标（对齐后续原型 `refine-movement-admin-detail-export`）：

```
列表（不动）
    │
    └── [详情] ──▶ ApplicationDetailDrawer（右滑）
                      ┌──────────────────────────────┐
                      │ 详情                     [×] │  fixed header
                      ├──────────────────────────────┤
                      │ 申请详情字段区块…             │  scroll
                      │ ──────────────────────────── │
                      │ ┌ Approval Log 表格 ───────┐ │
                      │ │ Description | Action By  │ │
                      │ │ Action By Role | Created │ │
                      │ └──────────────────────────┘ │
                      ├──────────────────────────────┤
                      │ [Export PDF]      [Close]    │  fixed footer（按场景）
                      └──────────────────────────────┘
```

已有可复用：`StudentProfileDetailDrawer`（右滑壳）、四 `*DetailModal`（字段布局）、`approvalLog[]`、`MovementApprovalLogTable`。

## 目标 / 非目标

**目标：**

- 11 个页面合并「详情 + 日志」为单一「详情」按钮
- 右滑抽屉：上详情、下审批日志四列表格、底固定操作
- 审批日志表格列：Description、Action By、Action By Role、Created At
- 列表其他操作按钮位置与行为不变
- 异动审批 Pending tab 的 Review 在抽屉 footer

**非目标：**

- 抽屉内上一条/下一条记录导航
- 改审批引擎、workflow 定义
- 无双按钮页面（如统计页、纯配置页）
- 将 Edit/Delete/Cancel 移入抽屉 footer

## 设计决策

### D1：壳组件分层

```
ApplicationDetailDrawer.vue          ← 通用：overlay、panel、header、scroll-body、footer slot
    ├── MovementApprovalLogTable.vue ← 通用：审批日志四列表格
    └── slot #detail                 ← 领域内容

MovementApplicationDetailDrawer.vue  ← 组装：queueItem → 详情内容 + 审批日志表格
CourseApplicationDetailDrawer.vue    ← 组装：course item → 详情内容 + 审批日志表格
```

**理由**：异动与课程详情结构差异大，共用壳 + 审批日志表格，内容分领域 wrapper。

> **演进说明**：首版曾实现 `ApprovalTimeline.vue` 竖向时间线；后续由 `refine-movement-admin-detail-export` 统一为详情在上、审批日志表格在下。

### D2：DetailModal 拆分

每个 `*DetailModal.vue` 保留对外 API（过渡期），内部改为：

```vue
<!-- DefermentDetailModal.vue -->
<Teleport v-if="standalone">
  <div c
