# 选课管理-学生选课结果与历史 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：enrich-student-history-batch-retake

## Context

选课历史行来自 `studentConfirmedCourses`。

## Decisions

1. 列位：选课时间后增加批次名称、是否重修，再课程来源/操作人。
2. 批次名由 `batchId` 解析；是否重修存 `isRetake`，展示是/否。
3. Demo 混入若干重修行。
4. 表容器 `overflow-x: auto`，表 `width: max-content; min-width: 100%`；默认单元格 `nowrap`。
5. 批次名称列：固定最大宽度、单行 ellipsis、`:title` 展示全文。
6. 操作人：`sourceType===admin`（或有管理员 operatorName）→ 管理员名；否则 → 当前学生姓名。

## Open Questions

- 无

## 来源：polish-student-waitlist-list

## 布局

对齐加退课/选课结果：标准 `search-bar` + 表格 + `TablePagination`。本页只读，无 toolbar 操作按钮。

## 列设计

参考选课结果取候补必要子集：

| 列 | 字段 |
|----|------|
| 课程代码/名称 | courseCode / courseName |
| 学分 | 从 selectableCourses 映射 |
| 教学分组 | section |
| 名额 | enrolled/capacity |
| 顺位 | position |
| 申请时间 | submittedAt（formatSelectedAt） |
| 状态 | entry status |

不展示任课教师、上课时间等未确认入选字段。

## Demo

`syncDemoWaitlistEntries` 每次 seed 执行：移除当前学生旧条目后写入 8 条，分散在 ENGL201、COMP3192、MATH201、COMP201、IT102、COMP220、STAT201、HUM110；waitlistQueue 补充后三门满员课。

## 筛选

- 状态：Pending / Approved / Rejected
- 关键词：课程代码或名称（不区分大小写）

## 来源：refine-student-my-result-unselect

## Context

`StudentMyResultView` 当前：`RoundTimelineBar` + 说明 + Study Plan 同步 + 简表（已基本含排课字段，无搜索、无退选）。  
在线选课确认后写入 `studentConfirmedCourses`，篮内展示字段为：

`courseCode · credits · courseName · sectionCode · lecturer · weekRange · classTime/time · room`

结果页必须回显同一套，不得发明参考旧系统多余列。

## Goals / Non-Goals

**Goals:**
- 结果页 = 说明 + 搜索 + 对齐字段的表 + 退选
- 退选仅选课阶段可用；成功后课程从个人结果消失，教学分组 `enrolled` 回退（有则 + 容量释放）
- 文案与列名与既有「教学分组 / 分组编号」一致

**Non-Goals:**
- 退课 Drop（`dropDeadlineWeek` 1～5 / 超期特殊审批）
- 参考图中的学期、操作人、IP 等无数据列

## Decisions

1. **退选 ≠ 退课**  
   - 退选：未开课、仍处于选课阶段，结果页自助释放名额，不走 Drop 审批  
   - 退课：开课后由加退课页处理（本 change 不实现）

2. **「选课阶段」判定（原型）**  
   以活跃批次仍处于选课相关轮次为准：批次存在且未进入「已开课/仅加退课」态。  
   具体：若批次有 `status` / 轮次时间可判断则用之；否则 demo 默认「可退选」，并在说明中写清规则。  
   开课阶段：隐藏或禁用「退选」，提示前往加退课办理退课（文案即可，不实现 Drop）。

3. **数据源**  
   优先 `studentConfirmedCourses`；无则回退 monitor 推导的已选列表（与现页一致）。退选优先改 confirmed；同步更新 schedule / monitor 学分与课表片段（最小一致）。

4. **搜索**  
   仅按课程名称（及可选课号包含）本地过滤；查询/重置交互对齐学籍列表搜索条。

5. **Study Plan 同步**  
   保留既有 demo 按钮，不扩大范围。

6. **演示种子加厚与分页**  
   - 已确认种子绑定 `selectableCourses` 的 `courseId`/`sectionId`，便于退选释放名额  
   - 覆盖：ME/GE、学分档、分组 01/02、字段齐全 vs 缺省、不同起止周  
   - 结果页复用 `TablePagination`；已选约半池时默认 `pageSize=5` 仍可翻页

7. **双菜单对半可操作**  
   ```
   批次课程池
   ├── 已确认半池 → studentConfirmedCourses（结果页退选）
   ├── 可选半池   → 有余量 + 资格通过（在线选课立即选课）
   └── 少量阻断样例 → 专业/Intake/满员候补等
   ```  
   - `getStudentPassedCourseCodes` 会把已确认课号视为已修：已选半池在在线选课显示「已修/已选」属预期  
   - 先修依赖用监控 `passedCourses`（如 MATH101）补齐，使可选半池资格成立  
   - 必要时调整满员课 `enrolled`、并增补 1～2 门无先修开放课，保证可选半池数量

## Risks / Trade-offs

- [Risk] 与加退课 Drop 文案混淆 → Mitigation：结果页说明明确两种动作；按钮仅标「退选」
- [Risk] 监控行与 confirmed 双源不一致 → Mitigation：退选时两边一并清理（能匹配到的行）
- [Risk] 已确认过多导致在线选课无可选 → Mitigation：对半拆分 + passedCourses 与容量调整

## Migration Plan

1. 改结果页 UI + store 退选 API  
2. 冒烟：在线选课确认 → 结果页回显 → 退选后名额与列表更新  
3. 加厚 seed + 分页；刷新后可见多页与检索

## Open Questions

（无；Drop 双分支另开 change）

## 来源：remove-student-my-schedule

## Context

学生端原有五页：`crs-register` / `crs-schedule` / `crs-adddrop` / `crs-waitlist` / `crs-result`。  
「我的课表」页用 `WeekScheduleGrid` + 已选清单；选课队列成功后 CTA 跳转该页。产品要求收敛为侧栏四页，成功后看「我的选课结果」。

数据层 `studentSchedule` 仍被加退课等逻辑引用，**保留 store，只去掉菜单与页面**。

## Goals / Non-Goals

**Goals:**
- 侧栏学生组不再出现「我的课表」
- 队列成功主 CTA → `crs-result`，按钮文案为「查看选课结果」
- 流程说明、briefs、App 挂载与死文案同步清理
- 删除 `StudentScheduleView.vue`

**Non-Goals:**
- 不删除 `WeekScheduleGrid`（管理端监控详情仍用）
- 不删除 `studentSchedule` ref / seed（加退课等仍依赖）
- 不修改 `add-course-registration-module` 历史文档

## Decisions

1. **删页面而非隐藏菜单**  
   无侧栏入口后保留 View 只会成死代码；删除 View + App 分支。

2. **CTA 事件重命名**  
   `view-schedule` → `view-result`，避免语义漂移；App 监听改为 `handleCrNavigate('crs-result')`。

3. **流程说明跨链**  
   `审批 → 我的课表` 改为 `审批 → 我的选课结果`（`approvalToResult`），阶段 G 的 `relatedPageIds` 去掉 `crs-schedule`。

4. **新建 change**  
   不回写已完成大提案的 Phase 历史条目。

## Risks / Trade-offs

- [Risk] 演示脚本仍口述「打开我的课表」→ Mitigation：流程说明页与成功文案已改
- [Risk] 有人本地仍设 `currentPageId = 'crs-schedule'` → Mitigation：developedPages 移除后会落到 UnderConstruction；可接受

## Migration Plan

1. 改菜单 / App / 队列 / 流程说明 / i18n，删 View
2. 冒烟：侧栏四项；提交选课成功后 CTA 进入「我的选课结果」

## Open Questions

（无）

## 来源：remove-waitlist-enrich-history-search

## Decisions

1. 菜单与路由去掉 `crs-waitlist`；`StudentMyWaitlistView.vue` 暂留文件不挂入口。
2. 选课历史新增筛选项从当前历史行去重生成下拉；与课程名称一并 且过滤。
3. 可选学生名单仅保留学号/姓名搜索。
4. 候补成功提示改为不再引导「候补结果」页。

## 来源：rename-result-waitlist-add-selected-at

## Decisions

1. **字段名** `selectedAt`：表示在线选课提交成功写入已选结果的时间，与 `classTime` / `time`（上课时间）分离。
2. **展示格式**：`YYYY-MM-DD HH:mm:ss`（与图示及学籍审批日志格式一致）。
3. **写入时机**：`applyConfirmedRegistration` 合并新课时若无 `selectedAt` 则填当前时间；demo 种子预置。
4. **文案**：菜单键 `menu.crsResult` / `menu.crsWaitlist` 改名；toast / 流程节点中「我的选课结果」「我的候补」同步改为新称呼。
