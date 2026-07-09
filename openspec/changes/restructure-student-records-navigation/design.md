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
│  .movement-tabs（水平 Tab，图2 红框样式）                  │
│  [ 转专业 ] [ 休学* ] [ 复学 ] [ 退学 ]                  │
├─────────────────────────────────────────────────────────┤
│  v-show activeTab                                       │
│    programme-transfer → ProgrammeTransferView           │
│    deferment          → DefermentView                   │
│    resumption         → ResumptionView                  │
│    withdrawal         → WithdrawalView                  │
└─────────────────────────────────────────────────────────┘
```

**Tab key 枚举**：`programme-transfer` | `deferment` | `resumption` | `withdrawal`

**默认 Tab**：`programme-transfer`

**状态保持**：四 View 同时挂载、`v-show` 切换（避免切换 Tab 丢失列表内存状态）

**样式**：
- Tab 条：白底 + 底边框；激活 Tab 蓝色下划线（对齐图2）
- 子 View 外层 `.movement-tab-panel`：`height: 100%`；必要时去掉子 View 外层 `padding` 重复（通过 `:embedded="true"` prop 或 scoped 穿透微调）

### 4. App.vue 路由分支

```javascript
// 移除
isProgrammeTransfer / isDeferment / isResumption / isWithdrawal

// 新增
isMovementApplication = pageId === 'sr-movement-application'

// template
<StudentProfileView v-if="isStudentProfile" />
<StudentMovementApplicationView v-else-if="isMovementApplication" />
<UnderConstructionView v-else-if="isSrUnderConstruction" />
```

### 5. 面包屑

沿用 `buildMenuBreadcrumbKeys`：

- 学生基本信息：`学籍管理 > 学生基本信息`
- 学籍异动申请：`学籍异动 > 学籍异动申请`

Tab 标签不进 breadcrumb（v1）。

### 6. i18n 新增 key（示例）

| key | ZH | EN |
|-----|----|----|
| `menu.srManagementGroup` | 学籍管理 | Student Records Management |
| `menu.srStudentBasicInfo` | 学生基本信息 | Student Basic Information |
| `menu.srMovementGroup` | 学籍异动 | Student Status Change |
| `menu.srMovementCategory` | 异动类别 | Change Category |
| `menu.srConsentForm` | 知情同意书 | Informed Consent Form |
| `menu.srMovementApplication` | 学籍异动申请 | Status Change Application |
| `menu.srMovementApproval` | 学籍异动审批 | Status Change Approval |
| `menu.srMovementMaintenance` | 学籍异动维护 | Status Change Maintenance |
| `menu.srMovementQuery` | 学籍异动查询 | Status Change Inquiry |
| `menu.srMovementStatistics` | 学籍异动统计 | Status Change Statistics |
| `menu.srStudyPlanGroup` | 学生个人学习计划 | Personal Study Plan |
| `menu.srPersonalCurriculum` | 学生个人培养方案 | Personal Curriculum Plan |
| `movementApplication.tabs.*` | 复用或映射四异动名称 | |

**废弃/移除**：`menu.srFamilyInfo`（可从菜单移除，i18n 可保留以免 flat 映射报错）

### 7. 四异动 View 嵌入适配（可选 prop）

若子 View 全屏 `padding: 24px 28px` 在 Tab 内显得过宽，可新增可选 prop：

```javascript
defineProps({ embedded: { type: Boolean, default: false } })
```

`embedded=true` 时减少外层 padding / 高度计算中的 header offset。**仅当冒烟发现布局问题时实施**，非必须首版任务。

### 8. OpenSpec 下游 delta

本 change 完成后，各 `add-*-app` 中 `student-records-app` delta spec 的「sidebar 点 Deferment 进入 DefermentView」场景在归档/sync 时需改为「学籍异动申请 Tab 进入 DefermentView」。本 change 的 spec 以新 IA 为准。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 四 View 嵌套后高度 / 双滚动条 | Tab 面板 flex 布局；`embedded` prop 微调 padding |
| 旧 bookmark 无 `sr-deferment` pageId | 无 vue-router，影响有限；文档说明 IA 变更 |
| 分组菜单默认全展开 | `defaultExpandedGroups` 三项全开，对齐 Basic Data 首访体验 |
| Tab 与图2 列数不一致 | 本 change 只做 Tab 壳层；统一表另开 change |

## 迁移说明

1. 重写 `studentRecordsMenu.js` 分组结构
2. 新增 `StudentMovementApplicationView.vue`
3. 更新 `App.vue` 分支与 `defaultExpandedGroups`
4. 更新 i18n
5. 冒烟：分组展开、四 Tab 切换、各异动 CRUD/6 态仍可用
6. 移除 Family Info 与四异动 sidebar 项
7. `npm run build`

## 待决问题

1. 是否在 v2 增加「保留入学资格 / 其它异动」Tab（占位 UnderConstruction）
2. 是否在 v2 将 Tab 名写入面包屑第三级
3. `sr-student-profile` pageId 是否在后续 rename 为 `sr-student-basic-info`（当前建议仅改 label）
