# 选课管理-学生在线选课 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 增量（2026-09 课程组对齐 / 课表预览 / 时段排序）

- [x] 课程组列：Group 左对齐 + Intake 下一行，单元格上下居中
- [x] `getSectionMeetings`：多段按时段 Mon→Sun、早→晚排序
- [x] `buildPreviewSchedule`：预览去重含教学分组，同课多分组均上表
- [x] `WeekScheduleGrid`：虚线冲突课块右上角 `!` + clashRowTip

## 增量（2026-09 退选按教学分组）

- [x] `unselectConfirmedCourse` / 已确认移除：按 `courseId + sectionId` 只删该行
- [x] `removeStudentPreselectVolunteer` 支持按分组撤销
- [x] 本轮选课情况 / 选课篮退选传分组；志愿调序键行级化

## 增量（2026-09 R2/R3 可选名额）

- [x] 分组级可选名额/总名额计算（R2 本池、R3 互释）
- [x] 主表/筛选/分组选择器文案与判满对齐；R1 不变

## 增量（2026-09 入口查看课程）

- [x] 入口按钮矩阵：R1 未开始/公布后可查看；R1 进行中进入选课；R2/R3 待开放屏蔽查看
- [x] `demoActiveRound: null` 无开放轮；GE/ME 增加 R1 未开放 demo 批
- [x] 同专业 4 档时间序（去掉 0b）；未开放批复用 R1 课表数据
- [x] `demoCatalogPhase` 固定 (0) 置顶；查看课程对齐正式 R1（ME 课程组/样式；隐藏容量列）

## 增量（2026-09 入口卡毕业学分文案与 GE tip）

- [x] `graduationCreditBar` 改用 `graduationElectiveProgressGe/Me`
- [x] GE 标题旁 tip（i18n zh/en）+ 图标可见尺寸

## 增量（2026-09 ME 课程组学分细分）

- [x] ME 进度改为 group4of3 / group3of2 / group2of1 / ordinary
- [x] 入口卡 / 列表工具条 / 监控 / 加退选 short keys + demo 同步

## 增量（2026-09 本轮选课情况课程组列与志愿软提示）

- [x] ME 本轮选课情况 / 选课篮志愿表加课程组列
- [x] `clashRowTip` 加长；新增同课多分组 tip；两者并存同 tip 展示
- [x] 课表冲突 tip 同步时间冲突长文案

## 增量（2026-09 ME tip 与本轮选课情况文案）

- [x] ME 标题 tip（培养方案过滤）
- [x] 标题改为「已提交 N 个志愿」；副标题同一行三条说明

## 增量（2026-09 学分胶囊文案与实时已选）

- [x] i18n：胶囊「(已选/要求)」+ 类型后缀；行标题去掉括号说明
- [x] 学期/毕业已选分子含待分配志愿；GE 分类与 ME 课程组按课实时汇总
- [x] 入口卡与列表工具条随退选刷新

## 增量（2026-09 列表顶栏本轮同源与右栏两行）

- [x] `listRoundStatusCreditCourses`：列表顶栏已选与本轮表同源
- [x] 列表工具条学分区：同一工具条行内毕业上/学期下，右栏限宽
- [x] 每行内总分+分类 nowrap 横排（分类不单独换行）

## 增量（2026-09 学分列对齐、入口同步与无超分色）

- [x] 毕业/学期两行列对齐；列表学分块再收窄
- [x] 入口卡按所选批次与列表顶栏同源
- [x] 无超分红色；demo 志愿学分降至 1～2 并挂入课程组

## 增量（2026-09 提交学分帽同源与入口四行）

- [x] `assertTermCreditCap` / 相关校验改本轮口径，与顶栏一致
- [x] 入口卡恢复标签+胶囊各两行的四行布局

## 增量（2026-09 本学期分类学分上限拦截）

- [x] `checkTermCategoryCreditCapForCourse`（本轮；GE 校选类别 / ME 课程组）+ 修正 `wouldExceedTermGeCategory`
- [x] 接入 `canRegisterRow` / tip / 提交门禁；i18n「学分超过上限不允许提交」
- [x] Demo：某分类满额使同类型提交钮置灰可见

## 增量（2026-09 列表查询条与学分工具栏冻结）

- [x] 包裹查询条 + 学分工具栏为 sticky chrome；白底/层级；GE/ME 同布局
- [x] 「本轮选课情况」不纳入冻结；冒烟：主内容区滚动时筛选与学分仍可操作

## 增量（2026-09 学分总分与分类明细分隔符）

- [x] 列表学分矩阵总分与分类之间加 `|`（跨行）；入口卡同步；GE/ME 同改

## 增量（2026-09 提交时间列）

- [x] `formatSelectedAt` 展示为 DD/MM/YYYY HH:mm:ss；存储仍用可解析时间戳；i18n「提交时间」
- [x] 本轮选课情况主表 + 排队中：状态前列「提交时间」
- [x] 我的选课·第一轮志愿结果：上课时间地点与志愿次序之间加列；历史 Tab 文案/格式对齐

## 增量（2026-09 ME 课程组 demo 对齐与退选百分比）

- [x] `selectionGroups` 改为真 4选3 / 3选2 / 2选1；组外普通选课行保留
- [x] demo 待分配志愿与组内课码对齐；退选同步撤志愿名单以刷新百分比

## 增量（2026-09 在线选课列表范围小字提醒）

- [x] 主表上方小字：选课页面只展示当前学期符合该学生类型选课的课程列表；GE/ME 同页

## 增量（2026-09 本轮选课情况课程已选百分比冻结列）

- [x] `StudentRegistrationRoundStatusPanel` 主表与排队表在状态/操作间加「课程已选百分比」冻结列；`sectionSelectedPercent` 取志愿人数/分组容量
- [x] CSS：`sticky-capacity` 右冻结；`has-capacity-col` 限定时 `sticky-status` 右偏移让位；仅 `showVolunteerOrder` 展示；emptyColspan 同步
- [x] 百分比包胶囊 `capacity-pill` + `sectionCapacityClass`（绿/黄/红与选课列表同源）；数据同源同步
- [x] 提案/spec/tasks 同步 §26

## 增量（2026-07）

- [x] 专业选修表增加「校选类别」列（文/商/理混杂展示）+ 表头 tooltip
- [x] 选课轮次下拉：测宽保留、对齐与字色优化
- [x] Tab 按课程大类硬过滤；GE demo 迁出 ME 批次；ME 校选类别非空

## 增量（2026-07 批次优先导航）

- [x] 提案/spec/design：批次优先、Tab 隐藏、轮次 demo 字段、Callout 位置
- [x] `registrationBatches`：可选 active 列表、选中批次、`demoActiveRound`、已配置轮次过滤
- [x] `StudentRegisterView`：批次+轮次、类型 Tab 随批次、Callout 下移、已过轮次仅禁立即选课
- [x] i18n：批次选择标签

## 增量（2026-07 GE demo 与操作列）

- [x] GE 批 HUM/BUS/MPU 命名 + 分批课表与不同轮次状态
- [x] 去掉「详情」；窗外轮次隐藏操作列
- [x] 操作列统一：每行提交按钮；不可提交则置灰 + 左侧感叹号 tip（含已占课）
- [x] 提交按钮左侧 tip 槽占位对齐；去掉类型 Tab
- [x] 窗外本轮选课：隐藏排队中；待分配只读；抽屉无操作列
- [x] 窗外状态列 sticky 贴右；第一轮志愿数量/容量色阶；学生提交不限容量

## 历史来源任务摘要

### add-register-ge-stats-row

```
## 1. 实现

- [x] 1.1 GE 统计 demo 数据与顶栏并排布局（历史）
- [x] 1.2 窄屏堆叠与文案自适应（历史）
- [x] 1.3 抽取 GE 统计组件并挂到管理端选课结果顶部
- [x] 1.4 学生端移除 GE；学分规则改为一行展示
```

### add-register-list-sections-column

```
## 1. 列表列

- [x] 1.1 `StudentRegisterView`：课程名称后加教学分组列（全部分组名称逗号拼接）
- [x] 1.2 i18n：表头「教学分组」
```

### add-student-credit-progress-toolbar

```
## 1. 数据与 UI

- [x] 1.1 扩展学分进度汇总（要求 + 历史/已确认归桶）
- [x] 1.2 选课页工具条同排展示；补充样式与 i18n
```

### collapse-student-cart-to-toolbar

```
## 1. 布局与抽屉

- [x] 1.1 新增 `StudentRegistrationCartDrawer`，迁入原侧栏内容
- [x] 1.2 `StudentRegisterView` 单列满宽 + 查询与列表间工具条按钮；更新 CSS/i18n
```

### default-register-entry-and-queue-ux

```
## 1. 实现

- [x] 1.1 默认落地 `crs-register`；默认轮次 `preselect`
- [x] 1.2 立即选课非静默弹队列
- [x] 1.3 成功按钮文案与打开本轮选课情况抽屉
```

### fix-register-list-ui-polish

```
## 1. 实现

- [x] 1.1 漏斗切换与面板层级
- [x] 1.2 已满不可候补 + tip 可见
- [x] 1.3 去热门；排队转圈
```

### flatten-register-table-by-section

```
## 1. 实现

- [x] 1.1 主表按分组展开并并入字段；横向滚动与分页
- [x] 1.2 行内立即选课；移除选分组抽屉
- [x] 1.3 立即选课弹框确认后再入队
```

### polish-my-courses-table

```
## 1. 队列与 Store

- [x] 1.1 `useRegistrationQueue`：silent / overlayVisible / reveal
- [x] 1.2 提交静默入队并立即返回；查看进度 API
- [x] 1.3 Demo 种子：排队中 + 失败 + 成功

## 2. UI 与文案

- [x] 2.1 「我的选课」表格与操作列
- [x] 2.2 确认轻提示；再选一次打开分组弹层
- [x] 2.3 i18n：选课失败、查看进度、再选一次、入队提示
```

### polish-register-capacity-column

```
## 1. 实现

- [x] 1.1 「已选/容量」满员红底 / 未满绿底
- [x] 1.2 去掉「选课状态」列及相关仅用逻辑
```

### polish-register-round-capacity-ux

```
## 1. 实现

- [x] 1.1 名额已选/容量；再次选课文案
- [x] 1.2 三轮命名、demo 间隔、箭头布局
- [x] 1.3 同步 tip / panel / brief 说明
```

### polish-section-credit-ux

```
## 1. 分组与退课

- [x] 1.1 分组弹层改为表格列表
- [x] 1.2 退选/批量退课确认

## 2. 学分提示与副标题

- [x] 2.1 轮次条上方学分要求 Callout
- [x] 2.2 我的选课副标题写清 min/max
- [x] 2.3 i18n
```

### polish-section-picker-credit-visual

```
## 1. 实现

- [x] 1.1 学分条单行醒目
- [x] 1.2 分组表 radio/表头/容量色/选中态
- [x] 1.3 COMP3192 demo 分组扩充
```

### polish-student-cart-section-style

```
## 1. 选课篮样式

- [x] 1.1 `StudentRegistrationCartDrawer`：条目改为分组卡片式两列字段布局
- [x] 1.2 同步/清理全局 `.cr-student-cart-item*` 样式以免冲突
```

### polish-student-register-toolbar

```
## 1. Tip 与类型

- [x] 1.1 选课篮 tip：完整可见（左对齐后向右展开）
- [x] 1.2 i18n：全局 `types.ME/GE/Mandatory.label`（中/英）

## 2. 工具栏布局

- [x] 2.1 移除在线选课工具栏培养方案学分进度 UI 及本页相关 helpers/样式
- [x] 2.2 选课篮与 ⓘ 左对齐（去掉右贴 `margin-left: auto`）
```

### queue-result-overlay-gated

```
## 1. 实现

- [x] 1.1 仅 overlay 打开时进入成功/失败结果态
- [x] 1.2 失败结果页 UI 与「本轮选课情况」按钮
```

### refine-my-courses-queue-ux

```
## 1. 队列与 Store

- [x] 1.1 hideOverlay；取消排队确认后写入 cancelled
- [x] 1.2 进度页精简 + 关闭/取消按钮
- [x] 1.3 表格取消排队与再选一次

## 2. 表格与入口

- [x] 2.1 批量退课 + 多选 + 冻结列 + nowrap
- [x] 2.2 入口按钮反色；去掉角标；文案「我的选课(n门)·已选x学分」
- [x] 2.3 i18n
```

### refine-queue-history-cart-ux

```
## 1. 实现

- [x] 1.1 队列已等待秒 + 不自动关弹层
- [x] 1.2 去掉再次选课；结果页去操作列；菜单与工具栏文案
```

### remove-register-adddrop-timeline-card

```
## 1. 轮次条

- [x] 1.1 `getRoundTimeline` 去掉 addDrop；清理 Register 跳转与时间条 navigate 样式
```

### split-student-register-by-course-type

```
## 1. 数据与批次上下文

- [x] 1.1 `getActiveBatch` 支持按 ME/GE 偏好；GE demo 批次 active
- [x] 1.2 GE scope 含各轮与演示 intake；GE 第三轮 `demoClosedRounds`

## 2. UI

- [x] 2.1 轮次下拉 + 类型 Tab 布局
- [x] 2.2 切换类型切换批次上下文并刷新列表轮次
- [x] 2.3 保留类型筛选与列；i18n
- [x] 2.4 轮次下拉样式对齐搜索区；去掉 roundPanel
- [x] 2.5 关闭轮次整页提示；行内 tooltip 仅个性原因
- [x] 2.6 轮次下拉宽度按最长文案自适应，不截断
```

### polish-list-context-batch-round-labels

```
## 1. 实现

- [x] 1.1 列表顶栏批次/轮次下拉左侧可见标签（复用 typeEntry.batchLabel / roundLabel）
```

### sync-register-search-with-table

```
## 1. 实现

- [x] 1.1 去掉选课资格；名额标签对齐已选/容量
- [x] 1.2 有余量/已满按分组行过滤
```

### course-level-table-merge（§8 · 2026-08）

```
## 1. 实现

- [x] 1.1 `sectionTableRowSpans.js`：课级 rowspan、按课程分页、课级 availability 过滤
- [x] 1.2 `StudentRegisterView`：序号按课程；同课不跨页；页内滚动
- [x] 1.3 更新 spec/design；build 通过
```

### unify-round-direct-register

```
## 1. Store 与队列

- [x] 1.1 单课提交进队列；履历 pending/success/failed；成功可退

## 2. UI

- [x] 2.1 分组弹层确认/关闭；我的选课抽屉；立即选课蓝更显眼；文案统一三轮
```
