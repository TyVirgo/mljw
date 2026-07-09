## 背景与动机

学籍管理应用当前采用 **扁平 6 项侧边栏**（学生档案、家庭信息、转专业、休学、复学、退学），与产品目标目录（图1）及生产系统「学籍异动申请」页（图2 Tab 切换）不一致。四异动模块已实现完整 6 态业务，但导航分散在侧边栏，不利于与「异动类别 / 审批 / 查询 / 统计」等二级菜单并列展示。

需重组为 **3 个一级侧边栏分组**，并将转专业 / 休学 / 复学 / 退学收敛至 **「学籍异动申请」页顶 Tab**，对齐图示 IA，同时 **移除 Family Info** 菜单项。

## 变更内容

### 侧边栏 IA 重组（3 个一级分组）

| 一级分组 | 二级菜单 | 首版状态 |
|----------|----------|----------|
| **学籍管理** | 学生基本信息 | ✓ 已实现（原 Student Profile，改名） |
| **学籍异动** | 异动类别 | 建设中 |
| | 知情同意书 | 建设中 |
| | **学籍异动申请** | ✓ Tab 壳层 + 四异动嵌入 |
| | 学籍异动审批（需支持会签） | 建设中 |
| | 学籍异动维护 | 建设中 |
| | 学籍异动查询 | 建设中 |
| | 学籍异动统计 | 建设中 |

- ~~**学生个人学习计划** | 学生个人培养方案 | 建设中~~ → **§8 移除整组**（本期不做）

- **移除** `sr-family-info`（Family Info / 家庭信息）侧边栏项
- **移除** 侧边栏独立的转专业 / 休学 / 复学 / 退学 4 项
- 侧边栏由 **扁平 6 项** 改为 **2 个 expandable group + children**（§8 起移除「学生个人学习计划」第三组）

### 学籍异动申请 — Tab 壳层（对齐图2 红框）

- 新增 **`StudentMovementApplicationView`**（或等效壳层页面）
- 页顶 **水平 Tab**：**转专业 · 休学 · 复学 · 退学**（v1 四 Tab；保留入学资格 / 其它异动为 Non-goal）
- Tab 内容 **嵌入现有** `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`（薄壳方案，不重写业务逻辑）
- 默认 Tab：**休学**（对齐图2）
- Tab 切换时保留各 View 内存状态（同页 `v-show` 或等价方案）

### 路由 / pageId 收敛

- 新增 `sr-movement-application` 作为侧边栏叶子菜单
- 废弃（或内部映射）`sr-programme-transfer`、`sr-deferment`、`sr-resumption`、`sr-withdrawal` 作为 **独立 sidebar pageId**
- `App.vue` 学籍分支：移除四异动独立 `v-if`，改为壳层单入口 + Tab 状态

### i18n

- 菜单分组与二级项中英文 key
- 「学生档案」→「学生基本信息」展示文案（`menu.srStudentBasicInfo` 等）
- Tab 标签复用现有 `menu.srProgrammeTransfer` / `srDeferment` 等或专用 `movementApplication.tabs.*`

### 面包屑

- 分组菜单：`学籍管理 > 学生基本信息` 或 `学籍异动 > 学籍异动申请`
- Tab 名称 **v1 不进面包屑**（仅页内 Tab 高亮）；后续可扩展

### 非目标（本变更不包含）

- 图2 统一大表（学年学期 / 异动原因 / 批量送审 / 统一列）— 后续独立 change
- 保留入学资格、其它异动 Tab 业务实现
- 异动类别 / 知情同意书 / 审批会签 / 维护 / 查询 / 统计 业务页
- **学生个人学习计划 / 学生个人培养方案**（§8 整组移除，后续独立 change 再接入）
- 四异动模块 6 态状态机、Mock、流转日志逻辑变更
- vue-router / URL 深链 Tab
- 门户拆分为多个 App 卡片

## 能力范围

### 新增能力

- `movement-application-shell`: 学籍异动申请 Tab 壳层——页顶 Tab 切换、嵌入四异动 View、默认 Tab、Tab 状态保持

### 修改的能力

- `student-records-app`: 侧边栏由扁平 6 项改为 **2 分组** IA（§8 移除 Personal Study Plan）；移除 Family Info；学生基本信息命名；`App.vue` 路由收敛

---

## §8 增量 — 移除学生个人学习计划分组（2026-06-24）

### 背景与动机

「学生个人培养方案」仅为建设中占位，现阶段不做。第三组仅含一项子菜单，保留空壳分组无产品价值。

### 变更内容

- 从 `studentRecordsMenuItems` **删除** `sr-study-plan-group` 整组（含 `sr-personal-curriculum`）
- `App.vue` `defaultExpandedGroups` 去掉 `sr-study-plan-group`
- `buildStudentRecordsBreadcrumbKeys` 移除 study-plan 分支
- i18n key 可保留（后续再接入时不破坏历史文案）
- PRD 菜单介绍改为「两组导航」

### 非目标

- 不影响 Basic Data「培养方案 / Programme Version」模块
- 不删除 i18n 词条（可选清理）

## 影响范围

- **新增**
  - `src/views/studentRecords/StudentMovementApplicationView.vue`（Tab 壳层）
  - 可选 `src/components/studentRecords/MovementApplicationTabs.vue`
- **修改**
  - `src/config/studentRecordsMenu.js` — 分组菜单树、`studentRecordsDevelopedPages`
  - `src/App.vue` — pageId 分支、默认 expanded groups
  - `src/i18n/locales/zh.js`、`en.js`、`zh-flat.js` — 菜单与 Tab 文案
  - `openspec/changes/add-*-app/specs/student-records-app/spec.md` 相关 delta（归档时同步）
- **复用**
  - `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`（嵌入，逻辑不变）
  - `Sidebar.vue` 分组模式（同 `menu.js`）
  - `PageBreadcrumb` + `menuBreadcrumb.js`
- **删除/废弃**
  - `sr-family-info` 菜单项
  - 四异动独立 sidebar 入口
