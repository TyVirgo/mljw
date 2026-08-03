# 选课管理-模块壳层与信息架构 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-course-capacity-settings

## Decisions

1. 百分比相对**源最大容量**缩放（100% = 导入时总容量）；不相对当前总容量叠乘。
2. 缩放后按原新生/老生比例重算配额，使 freshman + senior = 新总容量（即**有效最大容量**）。
3. 源最大容量仅在首次写入后冻结；有效最大容量 = 源最大容量 × 容量设置%。
4. 主表列序（容量相关）：`已选/有效最大容量` → 新生 → 老生 → 源最大容量 → 容量设置（`{n}%`）。
5. `已选/有效最大容量`：分子 = 已选新生 + 已选老生；分母 = 当前 `totalCapacity`；表头 tooltip 说明字段含义、计算方式与随容量设置的变化。
6. 容量设置弹窗：多选确认；默认当前 `capacityPercent`；确认后主表立即刷新。
7. 可选设置弹窗：结构对齐容量设置（上方 hint + 下方 help）；说明「是/否」对学生端列表可见与可选的影响，并与容量无关。
8. 源最大容量 tip：说明导入基准含义、不随容量设置变化、作百分比参照及与有效最大容量对照。
9. 主表 `nowrap` + `width: max-content` 横滑；左冻结 ☐ / 序号 / 课程代码 / 课程名称；学分及以后列不冻结。

## 来源：add-course-programme-scope-settings

## Decisions

1. 弹窗外壳对齐容量设置；专业多选对齐 `BatchScopeRuleModal`（标签触发器 + 面板勾选；选「不限」与具体专业互斥）。
2. 持久化：`audience.programmes = []` 或不限 → 不限制；非空数组 → 仅列表内专业可通过 `checkAudience`。不存 `All` 哨兵到 eligibility。
3. 选项：`courseProgrammeScopeOptions` = 图示码（ADT/CHS/COS/ENG/JRN）∪ 现有 `batchScopeProgrammeOptions`，去重，图示优先排前。
4. 主表列展示：不限，或专业码用顿号 `、` 拼接。
5. 多选课程打开弹窗：若所选课程专业范围一致则回填，否则默认「不限」。

## 来源：add-course-registration-module

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
appView: 'portal' | 'admin' | 'student-record

## 来源：hide-registration-report-menu

## Context

`cr-report` 已在菜单、App 路由、流程导览与 brief 中接入；产品暂不需要该能力。

## Decisions

1. **软隐藏**：去菜单与挂载，保留 View/data/i18n  
2. **分组改名**：governance 组仅剩白名单 →「特殊名单」/ Special lists  
3. **流程导览**：删除 `adminFlowNodes` 中报表节点；阶段 J `relatedPageIds` 置空（文案可仍写运营报表，不链到页）

## Risks

- [Risk] 深链 `cr-report` 会落到未开放页 → 可接受  
- [Risk] 死代码暂留 → 需求回笼再恢复挂载即可  

## Open Questions

（无）

## 来源：mark-prototype-callouts

## Context

`StudentRegisterView` 使用私有 `.cr-round-panel-note`（浅灰）；其它页用 `CourseRegistrationCallout`（蓝 info / 琥珀 warning）。

## Decisions

1. **样式**  
   搜索上方讲解条统一为 `CourseRegistrationCallout variant="info"`。

2. **后缀**  
   `common.prototypeOnlySuffix`：中文 `（正式页面可以去掉）`；英文 `(Can be removed on the production page)`。  
   **注意**：键必须挂在根级 `common` 下（勿误写入 `modal`），否则 `t()` 会回显 key 原文。

3. **加后缀的范围（纯说明）**  
   - `roundPanel.*`、`roundTooltip.*`、`cartRoundIndependentTip`  
   - `waitlistReadonlyHint`  
   - 其它明确「仅便于讲解」的 info Callout（按页审查）

4. **不加后缀**  
   - `unselectPhaseClosed` 等业务阻断  
   - 审批/退课通道规则 warning·rule（用户操作必需）

5. **拼接**  
   展示层 `t(key) + t('common.prototypeOnlySuffix')`，随当前语言自动切换中/英。

## Risks

- [Risk] 后缀过长挤占移动端 → Mitigation：正式上线直接删条

## Open Questions

（无）

## 来源：move-module-brief-to-breadcrumb

## Context

`ModuleBriefPanel` 同时承担：学生身份回显、管理端受众徽章、「页面说明」气泡。面包屑由 `App.vue` 的 `PageBreadcrumb` 渲染，在 `main` 之上，与页面内容分离。

## Decisions

1. **说明挂在面包屑行**：`PageBreadcrumb` 增加右侧 slot；选课应用下由 `App` 按 `currentPageId` 渲染精简后的 `ModuleBriefPanel`。
2. **Panel 只保留说明**：去掉学生姓名/学号与 `CourseAudienceBadge`；无有效文案时不渲染。
3. **页面内移除**：所有 `cr-*` View 与 `StudentPageShell` 不再内嵌 Panel，内容区自然上移。
4. **样式自洽**：说明按钮在灰底面包屑条内对齐；气泡样式随 Panel 自带，不依赖页面是否已 import 列表 CSS。

## Risks / Trade-offs

- 流程说明页无 brief：面包屑右侧为空，可接受。
- `CourseAudienceBadge` 暂无引用：保留组件文件，避免无关删除扩散。

## 来源：polish-course-group-label-and-menu

## Context

`teachingGroups` / `sectionCode` 中文分别为教学分组、分组名称。确认半池现为 10 条。`crGuideGroup` 为单行长文案。

## Decisions

1. 学生列表列：`teachingGroups`、`sectionCode`（学生表头场景）统一展示「课程分组」；`sectionNameDisplay` 可保持「分组名称{code}」单元格格式。
2. Demo：删 1 条管理员添加，总数 9；种子检测 `length !== 9`。
3. 菜单：`crGuideGroup` 恢复短标题；新增 `crGuideGroupHint`；Sidebar 对带 `labelHintKey` 的分组分行渲染。

## Risks

- 管理端若仍用 `sectionCode` 作列头也会变成「课程分组」——可接受或按页面另开 key。

## 来源：polish-student-page-layout

## 目标骨架

```
面包屑 + 页面说明（不动）
────────────────────────────────
[CourseRegistrationCallout]  [演示教学周? 仅加退课]
search-bar
toolbar（有操作才显示）
table + pagination
```

对齐管理端加退课审批页（图示1）与加退课通道说明（图示2）。

## 各页 tip 文案

| 页面 | tip |
|------|-----|
| 加退课 | 现有通道说明 + 演示周（移到搜索上方） |
| 候补结果 | `waitlistReadonlyHint` |
| 选课结果 | 仅当不可退选时显示 `unselectPhaseClosed`（callout warning） |
| 在线选课 | 无额外 tip（已有 RoundTimelineBar）；只去列表标题 |

## 保留

- 面包屑 ModuleBrief「页面说明」
- 选课篮面板标题与学分 meta
- 表格内操作列、分页总数

## 来源：realign-cr-admin-menu-ia

## Context

调研：白名单为 BOA 批准后教务导入的规则例外；补注册为主轮后/问题学生通道；监控/审批/候补为轮次内过程。二者不宜与「过程监控」同一语义，也不应单独占「特殊名单」一级。

## Decisions

1. **IA**：配置 → 过程 → 例外 → 结果（方案 2，贴调研）  
2. **例外名单** = `cr-supplement` + `cr-whitelist`；新建组 id `cr-exception-group`  
3. **过程组**仅保留 monitor / approval / waitlist  
4. **文案**：`批次与规则`、`选课过程`、`例外名单`、`结果与日志`  
5. 废弃 `cr-governance-group` 菜单节点（i18n 键可留）

## Risks

- [Risk] 用户习惯「补注册在过程里」→ 用流程说明/brief 对齐  
- [Risk] 面包屑父级变化 → 随 menu 自动更新  

## Open Questions

（无）

## 来源：remove-student-page-note-to-brief

## Decisions

1. **学生端四处对齐**：去掉内容区批次名占位；说明进各自 `ModuleBrief`（面包屑右侧）。
2. **在线选课**：四轮 `roundPanel` 说明汇总进 `studentRegister` brief，不再随轮次在页面切换展示。
3. **保留状态型提示**：加退课通道 callout、选课结果「退选阶段已关闭」等随状态变化的提示仍留在页内。
4. **Study Plan 提示**：结果页原 `ExternalDataHint` 随批次 note 移除；同步按钮旁保留轻量引用或依赖 brief 文案说明。

## 来源：scope-multiselect-course-selectable

## Decisions

1. 规则字段：`faculties[]` / `programmes[]` / `intakes[]`；匹配为维内 OR、维间 AND；含 `All` 则该维不限。
2. 选「全部」时清空同维其它选项；选具体项时移除「全部」。
3. 旧单值 `faculty/programme/intake` 经 `normalizeScopeRule` 迁入数组。
4. **方案 A**：主表去掉「开放轮次」，只保留「是否可选」；配额摘要列内容与展示不变。
5. `isSelectable` 默认 true；学生端按是否可选过滤，不再用 `visibleFromRound`。
6. 「可选设置」弹窗对齐图示3：标题「是否可选」、必填单选是/否、取消/确定；无多余说明文案。

## 来源：simplify-special-application-flow

## Context

在线选课、批次、选课结果已基本稳定。特殊申请侧现有：学生申请、审批、监控、补注册、白名单；补注册类型与白名单职责重叠；Replace 与白名单审批链非本期主路径。

## Decisions

| 决策 | 说明 |
|------|------|
| 本期菜单 | 学生：申请；管理过程组：监控、审批、缴费、补注册；白名单不进菜单 |
| 补注册 | 仅 `supplement` 一类；字段保留 canAdd/canDrop/canRetake 开关；入口：监控一键加入 |
| 申请 | 类型 Add / Drop / Retake / AddDrop；窗口内可申请；窗外须在补注册名单 |
| 审批 | 待办通过/驳回；联合单校验先 Drop 后 Add；账单勾选占位；无 Replace |
| 白名单 | 菜单隐藏；页面组件暂留不删 |
| 预警 | 继续嵌在监控，不恢复独立菜单 |

## Main Flow

```
监控发现问题 → 加入补注册
       ↓
学生申请（窗口开 或 在名单）→ 审批通过 → 选课结果 / 账单占位
```

## File Impact

```
src/config/courseRegistrationMenu.js
src/App.vue（可选：去掉 whitelist 分支入口依赖菜单即可）
src/views/courseRegistration/student/StudentAddDropView.vue
src/views/courseRegistration/AddDropApprovalView.vue
src/views/courseRegistration/SupplementListView.vue
src/views/courseRegistration/RegistrationMonitorView.vue
src/data/courseRegistration/supplementListQueue.js
src/data/courseRegistration/addDropApprovalQueue.js
src/data/courseRegistration/courseRegistrationFlowGuide.js
src/data/courseRegistration/courseRegistrationModuleBriefs.js
src/i18n/locales/zh.js / en.js
```
