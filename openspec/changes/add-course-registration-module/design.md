## 架构决策

### 独立应用 vs 学籍子菜单

**决策**：选课管理作为教学门户**独立应用**（第三张卡片），不复用 `studentRecordsMenu.js`。

**理由**：调研范围覆盖批次配置、审批、报表、白名单，与学籍异动生命周期正交；独立应用便于权限分包与 Phase 分期上线。

### UI 范式

复用学籍模块已验证模式：

| 模式 | 参考实现 | 选课应用 |
|------|----------|----------|
| 列表 + 筛选 + 分页 | `StudentProfileView` | 监控、结果、预警 |
| Tab + 审批队列 | `MovementApprovalView` | 加退课/重修审批 |
| 右侧抽屉详情 | `MovementApplicationDetailDrawer` | 批次、课程、学生、申请 |
| 未开发占位 | `UnderConstructionView` | Phase 2/3 页面 |

**列表页垂直结构**（与学籍管理一致）：

```
┌─ page-card ─────────────────────────────┐
│  [Tab 栏]（如有）                        │
│  ┌─ search-bar ─────────────────────┐   │
│  │ 条件字段（左）    查询/重置（右） │   │
│  └──────────────────────────────────┘   │
│  ┌─ toolbar ──────────────────────┐   │
│  │ 新建 / 导出 / 批量操作           │   │
│  └──────────────────────────────────┘   │
│  ┌─ table-section ────────────────┐   │
│  │ 数据表格 + 分页                  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

共享样式：`list-page-search.css`（搜索区）、`course-registration-list.css`（页面壳、工具栏、表格区）。

**模块说明与提示**

- `ModuleBriefPanel`：每子菜单顶部，三段式（调研来源 / 文档需求 / 本页功能），数据见 `courseRegistrationModuleBriefs.js`
- `CourseRegistrationCallout`：`info`（蓝）/ `warning`（琥珀）/ `rule`（灰）三级底色

**高并发选课队列**

参考购票队列 UX，**半透明灯箱** overlay（底层页面可见，非全屏实色蒙版）：

```
┌─ 半透明遮罩 rgba + blur ─────────────────┐
│         ┌─ 居中浮层卡片 ─────────┐      │
│         │ 蓝底状态区 + 预计等待 N 秒 │      │
│         ├─ 白卡片：课程/学生/批次 ──┤      │
│         │ [取消] / 成功 [查看课表]  │      │
│         └──────────────────────────┘      │
└──────────────────────────────────────────┘
```

默认等待 **5–8 秒**（demo 模拟排队）。触发点（demo）：
- 学生端「确认提交选课」、加退课 Add/Retake
- 监控详情「模拟在线选课提交」
- 加退课审批「批准」含 Add/Retake 时先走队列再落库

**学生端页面**

- 菜单分组 `cr-student-group` 置顶，一级标签「学生端」
- 五页：`crs-register` / `crs-schedule` / `crs-adddrop` / `crs-waitlist` / `crs-result`
- 共用 `RoundTimelineBar`（Pre/Main/Supp/Add-Drop）；`StudentPageShell` + `ModuleBriefPanel`
- **在线选课** `crs-register`：
  - `RoundTimelineBar` 可点击切换轮次（`interactive`）；每轮卡片 ⓘ tooltip（调研规则摘要）
  - G1 类别进度收拢至学分统计卡内（迷你进度条），不占主列表区
  - 主区：可选课程表格 + 右侧选课篮；补选轮次自动过滤已满课程
  - 预选轮次：志愿清单文案，提交不进入队列
  - Add/Drop 轮次：点击卡片直接跳转 `crs-adddrop`（侧边栏「加退课/重修」页）
  - **Phase 17**：列表「名额状态」合并容量与在篮/满员/开放；资格列短标签 + tooltip；操作列仅按钮
  - **Phase 17**：`StudentCourseDetailDrawer` 三段 section + footer「立即选课」；单分组快捷加购、多分组详情选组
- 按钮与 tooltip 规范对齐学籍列表页（`link-btn`、`hint-popover-wrap`）

### 路由与状态

沿用 `App.vue` 的 `appView` + `currentPageId` 模式，不引入 vue-router（与现项目一致）：

```
appView: 'portal' | 'admin' | 'student-records' | 'course-registration'
currentPageId: 'cr-batch' | 'cr-courses' | 'cr-monitor' | ...
```

### 菜单结构

```javascript
// courseRegistrationMenu.js（示意）
export const courseRegistrationModuleKey = 'menu.courseRegistration'

export const courseRegistrationMenuItems = [
  {
    id: 'cr-config-group',
    labelKey: 'menu.crConfigGroup',
    children: [
      { id: 'cr-batch', labelKey: 'menu.crBatch' },
      { id: 'cr-courses', labelKey: 'menu.crCourses' },
    ],
  },
  {
    id: 'cr-process-group',
    labelKey: 'menu.crProcessGroup',
    children: [
      { id: 'cr-monitor', labelKey: 'menu.crMonitor' },
      { id: 'cr-supplement', labelKey: 'menu.crSupplement' },
      { id: 'cr-approval', labelKey: 'menu.crApproval' },
      { id: 'cr-waitlist', labelKey: 'menu.crWaitlist' },
    ],
  },
  {
    id: 'cr-result-group',
    labelKey: 'menu.crResultGroup',
    children: [
      { id: 'cr-result', labelKey: 'menu.crResult' },
      { id: 'cr-alert', labelKey: 'menu.crAlert' },
    ],
  },
  {
    id: 'cr-governance-group',
    labelKey: 'menu.crGovernanceGroup',
    children: [
      { id: 'cr-whitelist', labelKey: 'menu.crWhitelist' },
      { id: 'cr-report', labelKey: 'menu.crReport' },
    ],
  },
]
```

### Demo 数据层

新建 `src/data/courseRegistration/`：

- `registrationBatches.js` — 批次与轮次时间
- `selectableCourses.js` — 课程、教学分组、配额 demo
- `registrationMonitorQueue.js` — 学生监控行
- `addDropApprovalQueue.js` — 审批队列（结构对齐 `movementApprovalQueue.js`）
- `registrationRules.js` — 学分上下限、Retake 优先级、冲突检测（前端纯函数）

### 外部模块边界

| 数据 | Phase 1 | 后续 |
|------|---------|------|
| 课程基本信息 | demo 常量 | 课程库 API |
| 教学分组时间/教室 | demo | 开课/排课 API |
| 先修课/G1 类别 | 只读 demo | 培养方案 API |
| Study Plan 同步 | toast 模拟 | Study Plan 变更包 |
| 账单/付款 | 状态字段 demo | 财务 API |

只读字段使用 `ExternalDataHint` 小组件（ⓘ + tooltip），避免用户误以为本模块可编辑。

## 核心页面设计要点

### 选课批次 `cr-batch`

- 列表：批次名称、学期、类型、**预选/正选/补选/Add-Drop 四列时间段**、范围、状态
- 轮次时间展示：`DD/MM/YYYY – DD/MM/YYYY`（与 `DatePickerEn` / `batchDateToPicker` 一致；存储仍为 `25-Aug-2025`）
- 抽屉：五段表单（基础/时间/范围/学分/通知）
- 发布校验：轮次时间不重叠、至少一个 Program+Intake
- 导出：与列表同构四列轮次字段，可独立勾选

### 可选课程（Phase 19：并入批次，不再独立菜单）

- 侧边栏无 `cr-courses`；配置入口在批次列表「管理课程」
- `BatchCoursesDrawer`：标题「为「{批次名}」管理课程」；表列出本批课程；详情复用 `SelectableCourseDetailDrawer`
- 抽屉内布局对齐列表页：搜索区 → 工具栏（`+ 从课程库导入`）→ 表格区；内容区补全 btn 样式（不依赖 page-card）
- 空批次展示空态 + 导入引导；`CourseLibraryImportModal`：课程库多选导入；已在本批课程禁用勾选
- 旧菜单 id `cr-courses` 访问时重定向 `cr-batch`

### 学生选课监控 `cr-monitor`

- 六指标统计卡
- 状态标签枚举与调研一致
- 抽屉：进度环 + G1 条 + 周课表 + 问题列表

### 加退课/重修审批 `cr-approval`

对齐 `MovementApprovalView`：

- Tabs: pending / submitted / history
- 申请类型 tag：Add | Drop | Retake | Replace | Add&Drop
- 审批引擎 `addDropApprovalEngine.js`：
  - `computeCreditsAfterApproval(add, drop, current)`
  - `detectScheduleConflict(addClass, currentSchedule)`
  - `suggestApprovalOrder(applications)` → 先 Drop 后 Add

### 补注册名单 `cr-supplement`（Phase 2）

- 名单类型与权限矩阵
- 与 monitor/warning 的「加入名单」动作写同一 store

### 候补名单 `cr-waitlist`（Phase 3）

- 课程列表（有余量/已满）→ 抽屉：已注册 | 候补 两表
- 管理端人工批准/拒绝候补；**不做自动递补**
- Demo：满员有候补、空候补、多顺位、已批准/已拒绝

### 白名单 `cr-whitelist`（Phase 3）

- 类型：超学分、先修例外、未来学期、毕业生特殊
- 审批链 demo：AC → HOP → BOA
- 状态：draft / acReview / hopReview / boaApproved / rejected

### 选课报表 `cr-report`（Phase 3）

- 五张卡片：参与率、学分分布、容量使用、加退课统计、问题学生
- 点击卡片展示明细表

### 默认入口

演示环境 `App.vue` 初始值：`appView='course-registration'`，`currentPageId='crs-register'`（学生端在线选课）

### 学生选课资格引擎 `studentEligibility.js`（Phase 6）

原型在学生提交选课前统一校验四维度差距（调研 P0）：

| 维度 | 判定来源 | 行为 |
|------|----------|------|
| 选课范围 | 批次 `scope`（Program×Intake） | 不匹配则不可见/不可选；补注册名单可突破 |
| 在校/注册状态 | 学籍 `statusLogs` 有效状态 | Deferred/Graduated 等阻断；复学后 Active 可恢复 |
| 先修课 | 课程 `prerequisites` + 已确认/已修代码 | 缺失则标记原因；白名单 `prerequisiteException` 或补注册 `bypassPrerequisite` 豁免 |
| 课程受众 | 课程 `audience`（可选） | 限专业/批次/新老生/国籍 |

输出结构：`{ eligible, reasons[], primaryReasonKey }`，供列表展示与 `addToCart` 拦截。

### 模块流程说明页 `cr-flow-guide`（Phase 7）

- 菜单置顶独立分组「模块说明」，与 15 个业务页区分
- 单页四段纵向布局：时间轴 → 双泳道主流程 → 联动关系 → 顺序约束
- 数据驱动：`courseRegistrationFlowGuide.js`（阶段/节点/联动/约束）
- 节点 `pageId` 与菜单 id 一致，`@navigate` 跳转 `App.vue` 路由
- 页顶 `CourseRegistrationCallout(rule)` 声明非编排引擎

### 批次表单抽屉 `RegistrationBatchFormDrawer`（Phase 8）

- 四段步骤序号 1–4；`field-label` + `*` 仅标必填
- `academicSession` 下拉选项与 `registrationAcademicSessionOptions`（`2024/09` 格式）一致
- 轮次/Add-Drop 日期：`DatePickerEn` ↔ 存储格式 `25-Aug-2025` 由 `registrationBatchFormUtils` 转换
- 新建草稿默认轮次日期为空；`addRegistrationBatch` 不再自动填充默认轮次

### 选课类型术语（Phase 9）

| 代码 | 英文 | 中文 | 适用范围 |
|------|------|------|----------|
| ME | Major Elective | 专业选修 | 批次 type、课程 type |
| GE | General Elective | 公共选修 | 批次 type、课程 type、类别进度展示 |
| Mandatory | Mandatory Registration | 必修注册 | 仅批次 type |

原 M1/G1 仅为原型误用缩写，已全局迁移；`g1Progress` 等内部字段名保留。

### 学生课程详情抽屉 `StudentCourseDetailDrawer`（Phase 17）

- 基于 `ApplicationDetailDrawer`，宽 960px
- 三段 section（step-badge 1–3）：基本信息、教学分组、修读说明（先修 + 大纲占位）
- **不展示**「你是否可选」资格区块；资格仅在列表列与按钮 disabled tooltip 体现
- Footer：关闭 +「立即选课」；须先选教学分组（多分组时）
- `CourseSectionCard` 供详情与 `StudentSectionPickerDrawer` 复用

### 批次课程管理抽屉（Phase 19）

```
批次列表 → [管理课程] / 课程数
         → BatchCoursesDrawer(batch)
         → [从课程库导入] → CourseLibraryImportModal → importCoursesFromLibrary
         → [详情] → SelectableCourseDetailDrawer
```

### 学生端教学分组排课字段（Phase 21）

- section：`lecturer` / `weekRange` / `classTime`（展示）/ `room`；`time` 保留供周表解析
- `CourseSectionCard` 标签化四字段；weekRange、classTime 带 hint
- 选课篮 / 课表清单 / 我的结果表同步列

### 术语：教学分组（Phase 22）

- 产品用语：中文「教学分组 / 分组编号」；英文「Group / Group No.」
- 内部标识仍用 `section`（与排课/开课 demo 对齐），避免无关重构
- 替换范围：`courseRegistration.*` 中英文展示串 + 流程说明 + 模块简介文案

### 学生端加退课申请（Phase 23）

- 去掉 `RoundTimelineBar`；工具栏：批次名 + 发起申请
- 申请表：`applicationCourse` 列仅课号；类型列单独本地化
- 页内/弹框说明：`CourseRegistrationCallout`；modal 内按钮单独写底色（脱离 page-card）
- 表单字段少 → `modal-overlay`（类型 + 课程）

### 候补 / 选课结果去统计卡（Phase 24）

- `StudentMyWaitlistView` / `StudentMyResultView`：移除顶部 `stats-row`
- 首屏直接进入 page-card（说明 + 列表 / 工具栏），减少与加退课一致的仪表盘感

### 我的候补只读（Phase 25）

- `joinStudentWaitlist` 仅由 `StudentRegisterView` 触发
- `StudentMyWaitlistView`：仅 `listStudentWaitlistEntries(currentStudentId)`；无 join 区、无轮次条
- 状态本地化复用 `waitlist.entryStatus.*`

### 在线选课 demo 覆盖（Phase 26）

- `sortCoursesForStudentDemo`：满员且 `eligible` 优先
- Demo 样例：`IT102`/`ENGL201`（满员可选）、`COMP201`/`PHYS101`/`BUS201`（有余量）、`COMP101`（已修）、`COMP3192`/`COMP220`（缺先修）、`COS210`/`SWE110`（受众限制）、`MATH201`（满员且缺先修）

### 在线选课去统计卡（Phase 27）

- `StudentRegisterView`：移除顶部 `stats-row`；保留 `RoundTimelineBar` + 列表/选课篮布局

### 我的课表去统计卡（Phase 28）

- `StudentScheduleView`：移除顶部 `stats-row`；保留说明、`WeekScheduleGrid` 与已选课程表

### 弹框提示与课表轮次条（Phase 29）

- `StudentAddDropView` 弹框：仅标题 + 表单字段 + 按钮，无内嵌 callout
- `StudentScheduleView`：去掉 `RoundTimelineBar` 与 `page-note`，主内容直接为周课表 + 已选列表

### 详情 / 选课 / 候补职责拆分（Phase 30）

- `StudentCourseDetailDrawer`：只读；`CourseSectionCard` `selectable=false`；footer 仅关闭
- `StudentSectionPickerDrawer`：立即选课唯一入口；即使仅 1 组也打开
- 选课篮条目 `intent: 'register' | 'waitlist'`：候补课程级（无 section），展示预计候补位；学分合计仅计正式选课
- 提交：先处理候补 `joinStudentWaitlist`，再对正式条目走既有队列确认

## 业务规则固化（来自调研）

| 规则 | 值/行为 |
|------|---------|
| 长学期学分 | 最低 12，最高 20（可按 Intake 配置，原 21 迁移为 20） |
| 短学期学分 | 最低 4 |
| 三轮选课 | 预选随机 → 正选先到先得 → 补选 |
| 新老生 | 老生提前一周；配额可分 total/senior/freshman |
| Retake | F 优先于 M；F 可跨课号走 Replace |
| Bill | 审批通过后生成，默认 48h 未付取消 |
| Add&Drop | 支持同单关联；审批先 Drop 后 Add |
| 第五周退课 | 仅特殊审批，非自助 |
| G1 类别 | 剩余学分不足以满足类别时限制继续选该类（数学等专业例外可配置） |

## 国际化

键名前缀 `courseRegistration.*`、`menu.cr*`，中英文同步。

日期展示：DMY + 英文月份缩写（如 12-Sep-2024）。

## 风险

1. **Waiting List** 校方未最终确认 — Phase 2 前保持 Under Construction 或简化人工流
2. **付款时序** 48h vs 3 天 — 批次级可配置，默认 48h
3. **与 Study Plan 双向同步** 边界复杂 — Phase 1 仅按钮 + 说明文案，不实现真实同步
