# 选课管理-选课批次 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-batch-local-rules-selectable

## Context

批次表单在去掉轮次后增加批次级规则与可选开关；与课程级 `isSelectable` 并存，互不覆盖。

## Decisions

1. 字段：`batch.isSelectable`（boolean，默认 true）；`batch.localRules = { linkPrerequisites, allowRetakeOnFail, allowDropSelfSelected, dropSelfSelectedMaxPerRound, allowExceedCreditMax }`。
2. 表单区块标题「选课规则」；不展示规则区/加退课区原型说明文案。
3. 时间标签统一「开始时间 / 结束时间」；对象限制默认展开，学期阈值 `minSemestersAbove` 默认 1。
4. 前三项默认勾选，N=10；`allowExceedCreditMax` 默认 false。
5. 列表用 `YnSwitch`；是否可选=false 原型只存。
6. 可退自选行 checkbox 与文案垂直居中对齐。

## Open Questions

- 无

## 来源：add-batch-special-student-roster

## Context

在用入口是 `BatchScopeRuleRosterDrawer`（三轮可选名单）。`batchStudentRoster.js` 已有 per-batch `special` 存储与 `BatchStudentRosterDrawer` 半成品（未挂菜单），本期接到在用抽屉并补齐新增/导入/是否可选修改。

## Decisions

| 决策 | 说明 |
|------|------|
| 作用域 | 整批一份 special，不挂 round |
| UI | 外层：**特殊｜可选**（默认进特殊）；可选内保留第一/二/三轮 |
| 角标 | 特殊 Tab **不显示**人数角标；人数用工具条 meta |
| 操作 | 特殊 Tab：新增、删除（勾选）、是否可选（勾选后改）、导入；筛选学号/姓名 |
| 新增 | 选择器与「添加学生选课」同源候选人；单选；是否可选 Y/N；备注可选 |
| 修改是否可选 | 勾选 ≥1 人打开「修改」弹框；多人时批量覆盖同一套是否可选 + 备注 |
| 进行中只读 | `batch.status === 'active'` 时特殊名单：搜/看可用；新增/删/是否可选/导入禁用；勾选列隐藏 |
| 导入 | Excel 学号列演示导入；命中池则写入，已存在跳过 |

## File Impact

```
src/components/courseRegistration/BatchScopeRuleRosterDrawer.vue
src/components/courseRegistration/BatchSpecialStudentAddModal.vue
src/components/courseRegistration/BatchSpecialStudentEditModal.vue（新建）
src/components/courseRegistration/BatchSpecialStudentPickModal.vue
src/components/courseRegistration/BatchSpecialStudentImportModal.vue
src/data/courseRegistration/batchStudentRoster.js
src/utils/importBatchSpecialRosterExcel.js
src/i18n/locales/zh.js / en.js
```

## 来源：add-batch-student-roster

## Context

- **参与范围（表单第 3 步）**：规则层 — Program×Intake + 自动导入复学
- **选课名单（操作列）**：实例层 — 展开后的学生行 + 特殊例外

## 入口与结构

```
批次列表 → 操作「选课名单」
  → Drawer
       顶栏：学年学期 · 批次名 · 范围摘要
       Tab：特殊学生 | 可选学生
       搜索 + 表格 + 分页
```

特殊名单可移除（原型）；可选名单只读查看（来源标记 scope / resumption）。

## 来源：add-course-visible-from-round

## Decisions

| 决策 | 说明 |
|------|------|
| 字段 | `visibleFromRound`: `preselect` \| `main` \| `supplement`，默认 `preselect` |
| 语义 | 从该轮起及之后轮次对学生可见 |
| 入口 | 工具条「可选设置」→ 本批课程表；详情限制条件同步 |
| 学生端 | `currentRoundOrder >= visibleFromOrder`；补选仍叠加余量过滤 |

## File Impact

- `BatchCoursesDrawer.vue`
- `BatchCourseOptionalSettingsModal.vue`（新）
- `SelectableCourseDetailDrawer.vue`
- `selectableCourses.js`
- `studentRegistrationContext.js`
- `zh.js` / `en.js`

## 来源：batch-table-horizontal-scroll

## Context

全局 `.cr-list-page .table-wrap` 已有 `overflow-x: auto`，但 `.data-table { width: 100% }` 使列被压缩换行。学籍侧已有左多列冻结（`StudentProfileView`）与右操作列冻结（`MovementQueryView`）先例。

## Decisions

1. **仅改批次页**：用 `.batch-data-table` 覆盖宽度、换行与 sticky，避免牵动全部 `cr-list-page`。
2. **名称两行**：内层 `line-clamp: 2` + `max-width: 240px`，完整名称用 `title`。
3. **左右冻结**：`position: sticky`；左 `序号 left:0`、`名称 left:<序号宽>`；右 `操作 right:0`、`状态 right:<操作列宽>`；实底色 + 边缘阴影/分割线。
4. **操作列宽**：按「编辑 + 管理课程 + 发布」最宽态估固定 `min-width`，保证状态列 `right` 偏移稳定。

## Risks

- 窄屏冻结区占比较大，中间可滑区域变窄，可接受。

## 来源：differentiate-round-demo-courses

## Context

`filterCoursesByRound` 按 `visibleFromRound` 累计过滤；多数课默认 `preselect`，一二轮列表几乎相同。

## Decisions

1. 主批次（`batch-2504-m1`）中一批选修/后置课改为 `visibleFromRound: 'main'`（如 BUS201、COMP220、AI110、WEB210、SE220、GE201、DB110、PHYS101、STAT201 等）；IT102 保持 main；HUM110 保持 supplement。
2. 核心课（ENGL201、COMP201、COMP101、COMP3192、MATH201 等）保留默认 preselect。
3. 不改 `filterCoursesByRound`。

## Risks

- 无；仅 demo 种子。

## 来源：enrich-batch-active-demo

## Context

列表页 `RegistrationBatchView` 展示状态来自 `registrationBatches`；参与范围数来自 `scopeRules`；可选课程数来自 `countCoursesByBatch`（非 `meBatch.courseCount`）。学生端 `getActiveBatch()` 取第一个 `status === 'active'` 的批次。

## Decisions

1. **删草稿**  
   去掉若干纯占位院系草稿（如 MAT/PHY/MBT/JRN/ADT 及部分冗余层级），总量仍约十余条量级。

2. **增「进行中」**  
   除 `batch-2504-m1` 外，再设 3 条左右 ME 为 `active`，各配 3～5 条 `scopeRules`（学院/年级/专业/分组具体值）。

3. **主 demo 顺序**  
   `batch-2504-m1` 必须排在其他 `active` 之前，保证 `getActiveBatch()` 不变。

4. **课程数**  
   新 active 批次各挂约 8～12 门轻量 demo 课程（可从既有课模板改 `batchId`/`id`），避免列表课程数为 0。

5. **分页**  
   本变更明确不改 `TablePagination`。

## Risks

- [Risk] 多个 active 误抢 `getActiveBatch` → Mitigation：数组中 `batch-2504-m1` 最先出现
- [Risk] 新批次课程过少观感差 → Mitigation：每批至少约 8 门

## Open Questions

（无）

## 来源：enrich-batch-scope-demo-data

## Context

`defaultScopeRulesForProgramme` 默认 `faculty=''`、`groupName=''`，明细抽屉展示为「不限」。

## Decisions

1. **专业→学院映射**（demo）  
   Information：SWE/COS/DSA/AIT/CYS/CST/CSN/DS  
   Business：ACC/FIN/IBU  
   Energy & Chemical：MAT/PHY/MBT/CHS  

2. **默认两条规则**  
   `{ faculty, grade: 2024, programme, groupName: `${programme}2409-G1` }`  
   `{ faculty, grade: 2025, programme, groupName: `${programme}2504-G1` }`

3. **活跃批次**  
   SWE×2024 一条 `groupName: ''`，保证当前演示学生（无分组）仍可匹配；其余规则填具体分组。

4. **「不限」保留**  
   仅用于刻意宽松规则（如上述 demo 命中行），不再作为默认种子常态。

## Risks

- [Risk] 过严分组导致学生端不可选 → Mitigation：活跃 SWE 2024 留空分组

## Open Questions

（无）

## 来源：enrich-scope-detail-roster

## Decisions

1. 复用 `matchScopeRule`：学院/批次/专业；轮次不参与人数与名单过滤。
2. 使用共享 demo 学生池按规则过滤；行与行独立，不合并。
3. 名单为叠层只读抽屉，不带特殊名单 Tab；不改批次级「学生选课名单」既有能力。
4. 列表列「参与范围」不改名。

## 来源：isolate-rounds-and-enrich-sections

## Context

`registrationCart` 为全局单一 ref；`filterCoursesByRound` 仅按 `visibleFromRound` 筛课。批次表单轮次块只有时间。多数课 `sections.length === 1`。正选 `roundPanel` 只写「清单不共享」，易被理解成容量也分轮。

## Decisions

1. **分轮次状态**  
   `roundState.preselect|main|supplement` 各含 `cart` + `appliedSearch`（可选 `searchForm`）。对外兼容：当前轮次映射到现有 `registrationCart` 读法，或页面直接按 `selectedRound` 取分桶。

2. **无轮次准入拦截**  
   批次范围内学生三轮均可提交；预选优先规则仅影响超额入选顺序（demo：配置项 + tip，可不做完整抽签）。

3. **优先规则挂批次**  
   `batch.preselectPriority = { preferSenior, preferRetake, preferGraduate }`，继承批次 scope（谁能选课），收窄对象是优先群体。表单在预选轮次块下展示，带 tooltip。

4. **教学分组**  
   `batch-2504-m1` 可选课补 2～3 个 section；同步 `sectionCount` / capacity 汇总。交互仍单选。

5. **说明**  
   挂出 `roundPanel`；强化 `roundTooltip`；篮按钮旁短 tip「本轮独立」。  
   **容量**：文案明确「选课篮/志愿按轮独立，课程容量一份共享」——预选优先学生占满后，正选显示已满，新生不可再占该名额。

## Risks

- [Risk] 改全局 cart API 影响加退课等 → Mitigation：仅在线选课页用分桶；提交正选仍写确认课表
- [Risk] capacity 与 sections 不一致 → Mitigation：加厚时重算汇总字段

## Open Questions

（无）

## 来源：polish-batch-courses-main-table

## Decisions

1. 主表列（2026-08）：☐ 序号 代码 名称 **课程分组❄** 学分 课程类别 任课教师 起止周 上课时间地点 已选/有效容量 新生 老生 容量设置% …；必须NOT 展示「课程分组数」「源最大容量」。
2. 课程类别用现有 `type` + `getRegistrationTypeLabel`；列头文案为「课程类别」。
3. 一行 = 一个课程分组；勾选键 = `section.id`；新老容量读 section 级 quota / enrolled*；`enrichCourse` 按容量比例派生分组新老名额。
4. 「已选/容量」按**分组** `enrolled/capacity`；名额分配写 `updateSectionsAudienceQuota`；可选/容量%/专业范围对勾选 section 反查 `courseId` 去重。
5. 隐藏工具条「添加课程」；不删 `CourseSectionsModal` / `SelectableCourseDetailDrawer`（其它入口可留）；管理课程主表不再点开分组明细。
6. 配额 Tab、GE 类别等本变更不暴露。
7. 管理课程副标题：`getRegistrationTypeLabel(batch.type)`，与表内课程类别一致。
8. 默认分页 20 条/页；列表「共 N 条」按展平行数；工具条「本批次已有 X 门课程，包含 Y 课程分组」。
9. 课程 demo：凡有课的批次补齐至 ≥25 门（主批手工课保留，不足用 `buildActiveBatchDemoCourses` 补）。

## 来源：polish-batch-drawer-tables

## Decisions

1. 表头：`background #f9fafb`、`font-weight 600`、`font-size 14px`；表体 13px；仅 `border-bottom`。
2. 保留表头 `sticky top`（纵向滚动时表头可见），不做左右冻结列。
3. 发布确认用 `window.confirm`，文案含批次名称。

## 来源：polish-batch-form-draft-scope-dates

## Decisions

1. 存草稿：`emit('save', { ...payload, status: 'draft' })`；保存：编辑保留原 status，新建仍为 draft。
2. 空 `scopeRules`：匹配视为不限制；`publishRegistrationBatch` 去掉范围必填校验。
3. 时间链：同窗 `start ≤ end`；跨窗下一段 `start ≥ 上一段 end + 1 天`；`DatePickerEn` 增加 `minDate`/`maxDate`（DD/MM/YYYY）。
4. 改前序日期后，清空后续已冲突的值。
5. 保留 `prototypeOnlySuffix`；仅删特殊名单句与 `scopePublishHint` UI。
6. 去掉表单「学分规则」区块；表单内部与保存 payload 仍带 `creditMin`/`creditMax`（默认 12/20 或编辑原值），下游逻辑不变。

## Risks / Notes

- 学分上下限改由选课规则或数据默认值承担；批次表单不再暴露编辑入口。

## 来源：polish-batch-manage-students-entry

## Decisions

1. 列表入口文案为「学生清单」；点击后直接打开可选学生名单，不再经过参与范围明细。
2. 名单范围 = 本批全部轮次可选学生；用三个固定 Tab（第一轮 / 第二轮 / 第三轮）切换。
3. 某 Tab 对应轮次若无 `scopeRules`，该 Tab 展示空名单（无学生数据），Tab 仍保留。
4. 按轮聚合：取该轮全部规则做 `listStudentsForScopeRule` 并集，按学号去重。
5. 删除 `BatchScopeRulesDrawer`；列表改为挂载/打开 `BatchScopeRuleRosterDrawer`（可按批次打开，不再依赖单条 rule）。
6. 「管理课程」不变；列表不展示「参与范围数量 / 可选课程数」。
7. 名单筛选与列：学号/姓名分搜；列序学号、姓名、专业、批次、所属学院。
8. 抽屉壳对齐 `BatchCoursesDrawer`（标题层级、分区、宽度、表头样式）。
9. 「多选平铺」：名单侧一行一学生（入学批次已拆开）；不再在中间层展示顿号拼接的维度多选。
10. 列表「可选课人数」= 三轮 Tab 人数相加（`countEligibleStudentsAcrossRounds`），置于「是否可选」前；数字可点打开学生清单；表头问号 tooltip 说明口径。
11. 学生清单不展示标题与 Tab 之间的批次合计横幅；保留各轮「本轮」统计；Tab 无人数角标。

## 来源：polish-batch-names-and-drop-ui

## Context

图示批次命名统一为英文长名 + `2026/04 Academic Session`。学生课表仍依赖 `batch-2504-m1`。Drop UI 已有逻辑，缺布局对齐。

## Decisions

1. **命名种子**  
   按图示生成 20 条 ME 批次；`batch-2504-m1` 对应  
   `Major Elective Selection (I) for SWE 2026/04 Academic Session`，`status: active`，`academicSession: '2026/04'`。  
   另保留 1 条 GE、1 条 Mandatory（closed/draft）供类型筛选。

2. **scope**  
   各 ME 批次 `scope` 以对应院系码 × intake 为主（如 `SWE×2409`）；演示学生仍命中 SWE active。

3. **Drop UI**  
   - 工具栏：批次名 + 发起申请  
   - 其下 search-bar：演示教学周（select）  
   - callout：单段状态（常规/超期）+ 截止周一句  
   - 通道列：复用 `type-tag` 色系  
   - 特殊表单：`form-input`/`form-textarea`；附件为按钮触发 file + 文件名展示

## Risks

- [Risk] 列表变长影响演示翻页 → Mitigation：本就有分页，pageSize=10
- [Risk] 旧截图/文档仍写 2504 ME… → Mitigation：代码内硬编码改为动态名

## Open Questions

（无）

## 来源：polish-batch-preview-suffix

## Decisions

1. 只改 `common.prototypeOnlySuffix` 文案，调用点不变；与 `crGuideGroupHint` 中文一致。
2. 英文对齐为 `(Remove on production page)`。
3. 删除 UI 预览行；保存时仍用 `formatRoundsSummary` 写入 `roundsSummary`（列表展示不受影响）。

## 来源：polish-batch-roster-table

## Context

`BatchStudentRosterDrawer` 已有 `batch-roster-body`、`table-wrap`、`data-table` 类名，但 scoped 未定义表格边框/表头，且未设置 `drawer-scroll` 灰底与白卡片边距。`BatchCoursesDrawer` 已是模块内抽屉表格标杆。

## Decisions

1. **对齐对象**  
   以 `BatchCoursesDrawer` 的 `.batch-courses-drawer` / `.batch-courses-body` / `.table-wrap` / `.data-table` 为唯一参考，选课名单侧用等价类名（`batch-roster-*`）拷贝样式。

2. **结构**  
   ```
   ApplicationDetailDrawer
     drawer-scroll（灰底 #f3f4f6, padding:0）
       batch-roster-body（白卡片 margin/padding/border）
         参与范围 / Tab / search-bar / table-section
     footer：关闭
   ```

3. **不抽公共文件**  
   两抽屉样式体量小，本轮复制即可；后续若第三处抽屉再抽 `batch-drawer-content.css`。

## Risks

- [Risk] 抽屉宽度与 courses 不一致 → Mitigation：同样 `min(1100px, 94vw)`
- [Risk] 局部 `link-btn` 覆盖全局 → Mitigation：scoped 内仅保留 danger + hover underline

## Open Questions

（无）

## 来源：polish-batch-scope-count-column

## Context

可选课程数列：`link-btn` + 数字 → `BatchCoursesDrawer`。参与范围现为 `scope.join(', ')` 长文本。

## Decisions

1. **单元格**  
   `getBatchScopeRules(batch).length`；`0` 仍可点（空态抽屉）；无批次时不出现。

2. **抽屉**  
   只读表：序号、学院、年级、专业、分组名称；壳样式对齐 `BatchCoursesDrawer`（灰底白卡片 + table-wrap）；底栏关闭。

3. **空维展示**  
   未填维度显示「不限」或 `—`，避免空白难读。

## Risks

- [Risk] 与「编辑」重复入口 → Mitigation：抽屉只读，文案标明明细查看

## Open Questions

（无）

## 来源：polish-register-scope-adddrop-ui

## Decisions

1. 先修课筛选项：`''` 全部、`none` 无先修、其余为具体先修课代码（来自本轮课程）。
2. 学分筛选项与现有 `credits` 共用；顶部下拉与表头筛选同步。
3. 范围展示顺序统一为学院→专业→批次→轮次，不改数据模型字段名。
4. 退课分组展示复用 `sectionNameDisplay`；退费抵免仅退课类型显示在课程名称右侧。

## 来源：polish-scope-detail-layout

## Decisions

1. 列表列专用 key `scopeCountLabel`；`scope` 仍用于表单 Step3 等「参与范围」语义。
2. 用 `buildCohort` 按学院×专业×批次生成不同规模队列（≥20，规模错开）。
3. 抽屉去白卡片与 meta/摘要行；`drawer-scroll` 改为 flex 铺满，表体区域内部滚动。

## 来源：progressive-batch-round-setup

## Context

续修：第一轮从新建/编辑迁入「管理轮次」；锁定轮次仍展示字段置灰。

## Decisions

1. **新建/编辑**：仅基本信息、是否可选、局部规则、Add/Drop；保存时保留批次已有三轮日期与全部 scope / preselectPriority。
2. **管理轮次**：R1+R2+R3；R1 始终可编辑；R2/R3 闸门未开时字段置灰 + 原因；默认全展开可折叠。
3. **闸门**：`volunteerFinalConfirmedAt` → R2；`rounds.main.end` 已过 → R3。
4. **Demo**：分层不变；新建批次三轮初始可为空（列表「未配置」）。

## Open Questions

- 无

## 来源：refine-batch-adddrop-bill-days

## Context

原先批次级 `billHours`、教学周截止 + `selfServiceDropNoApproval` 控制退课通道；学生端用演示教学周切换自助/特殊。新产品口径改为全局缴费宽限天数 + 申请窗口日期闸门。

## Decisions

1. 新增规则 `CR107`（count）：延迟缴费天数，默认启用、值 `2`；批次不再存 `billHours`。
2. `preselectPriority` 仅保留 `preferSenior`；UI 去掉重修/毕业生。
3. 批次「加退课申请」仅 `addDropWindow.start/end`；删除 `dropDeadlineWeek`、`selfServiceDropNoApproval` 表单项与保存字段（历史数据可忽略）。
4. 学生端以申请窗口判定 `isWithinAddDropApplicationWindow`：窗外禁用发起；窗内 Drop 一律进审批（不再自助直批、不再要求特殊附件）。
5. 演示教学周切换从加退课页移除（不再作为能否申请的依据）。
6. Demo 批次 `addDropWindow` 调整为覆盖当前演示日期，避免闸门误伤。

## Risks / Trade-offs

- 历史申请记录仍可能带 `dropChannel=special/self`，列表展示保留即可。
- 本地已存的 v2 规则无 CR107 时，加载时按 defaults 合并补齐。

## 来源：refine-batch-elective-round1-scope

## Context

批次表单类型含 Mandatory；`preselectPriority.preferSenior` 文案仍是超额优先；范围规则含 groupName。

## Decisions

1. `registrationBatchTypeOptions` 仅 ME/GE；`normalizeRegistrationType('Mandatory')` → `ME`；demo Mandatory 批次改为 ME 选修命名即可。
2. 标题/说明/勾选文案改为「第一轮选课对象限制 / 仅限老生（新生第二轮）」；默认勾选不变；对象限制区块可折叠，默认收起。
3. 范围弹窗传入 `fixedRound` 时隐藏轮次选择（值仍写入对应轮次）。
4. 范围弹窗去掉分组字段；confirm 固定 `groupName: ''`；明细抽屉与 `formatScopeRuleLabel` 不再展示分组；匹配时忽略 groupName；说明去掉分组与「额外分组」条目。

## Risks

- 历史规则若曾依赖 groupName 收窄范围，忽略后范围变宽；原型可接受。

## 来源：refine-batch-scope-by-faculty-grade

## Context

`scopeRules` 仅四维；资格 `matchScopeRules` 与轮次无关。弹窗单列。旧提案曾写「无选课轮次」，现产品要求按轮配置范围。

## Decisions

1. **字段**：`round: '' | 'preselect' | 'main' | 'supplement'`，空表示各轮共用  
2. **匹配**：`effective(R) = rules where !round || round===R`；再对 effective OR 匹配学生维度  
3. **UI**：弹窗两列；轮次非必填下拉；列表标签显示轮次或「各轮」  
4. **资格**：`buildEligibilityContext` / `getSelectableCoursesForStudent` 传入当前 `activeCartRoundKey`  

## Risks

- [Risk] 仅配置某轮专属、无全局规则时，其他轮无人可选 → 接受（配置意图）  
- [Risk] 旧数据无 round → 视为空=各轮共用  

## Open Questions

（无）

## 来源：refine-batch-scope-intake

## Decisions

1. 规则字段用 `intake`（`YYYY/MM` 或 `All`）；加载时把旧 `grade` 年映射：`2024→2024/09`，`2025/2026→YYYY/04`，已是 `YYYY/MM` 则规范化保留。
2. 选项来自 `intakeOptions`（入学批次模块）。
3. 「全部」值为 `All`；展示用 i18n `scopeDimAll`。
4. 四字段必填：学院非空；批次/专业非空（含 All）；轮次默认「各轮共用」（`round: ''`）即已选。
5. `matchScopeRule` 用规范化后的 intake 与 `profileFields.intake` 比较。
6. `formatDimList` 统一数组多选展示：`[值]` / `[A,B]`；空仍为 `—`；表格 `dimLabel`、摘要 `formatScopeRuleLabel`、导出同源。
7. 范围编辑：`BatchScopeRuleModal` 支持 `initialRule`；抽屉持有 `editingScopeIndex`，确认时替换；`fixedRound` 不变；锁定轮禁用编辑。

## 来源：remove-batch-courses-empty-import-btn

## Decisions

空状态仅保留「本批次暂无课程」+ 提示文案；导入唯一入口为工具条「+ 从课程库导入」。

## File Impact

- `src/components/courseRegistration/BatchCoursesDrawer.vue`

## 来源：require-scope-round-specific

## Decisions

1. 轮次单选且必填：`preselect` | `main` | `supplement`；去掉空值「全部轮次」。
2. `filterScopeRulesForRound`：仅返回 `rule.round === roundKey` 的规则。
3. 主活跃 `batch-2504-m1` demo 三行覆盖三轮；维度展示多选/全部即可，不穷举。
4. `defaultScopeRulesForProgramme` 改为三轮各一条（同专业、双入学批次多选）。
