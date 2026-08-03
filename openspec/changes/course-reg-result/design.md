# 选课管理-管理端选课结果 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-admin-result-roster-actions

## Context

按学生批量删除已对齐学籍。按课程结果原先由 `selectableCourses` 现算，无可变删除池；现补管理端课程结果池，UI 与按学生对称。

## Decisions

1. **工具条**：两 Tab 均 `[导出] [删除] …… [同步]`；文案 `common.delete`；样式学籍 `btn-dark`  
2. **勾选**：两 Tab 首列全选/行选；切 Tab / 查询重置清空勾选  
3. **按学生删除**：`removeAdminStudentRegistrations`  
4. **按课程删除（语义 A）**：`adminCourseRegistrationResults` + `removeAdminCourseRegistrations`；仅本表隐藏，不动课库、不级联学生  
5. **按课程行**：保留「添加学生」  

## Risks

- [Risk] 课无分组 → Mitigation：确定时提示无法添加  
- [Risk] 删除课程结果后「添加学生」入口随行消失 → 接受（行已删）  

## Open Questions

（无）

## 来源：add-preselect-volunteer-confirm

## Context

第一轮志愿按教学分组调整名单。分组容量各不相同，全部之和等于课总容量。

## Decisions

1. **入口**：选课结果 Tab 顺序 `第一轮志愿 | 按轮次 | 按学生`；进入页面默认「第一轮志愿」。
2. **主表粒度**：一行 = 课程 × 教学分组；列含课程类型、课程分组、志愿数/分组容量；不展示「调整」列。
3. **名单 key**：`courseId + sectionId`；抽屉绑定该分组；满容按该分组 capacity 硬拦。
4. **抽屉列表**：学号、姓名分条件左右排搜索 + 分页；工具行「添加学生」左对齐、容量描述右对齐；分页固定；表区纵向滚动。添加/移出/保存仍针对全量草稿。
5. **页说明**：第一轮志愿 hint 使用 info callout 底色；文案末保留句号（正式页可再去）。
6. **批次添加课程文案**：`courses.import` 及相关空态/弹窗标题统一为「添加课程」，行为仍打开培养方案勾选弹窗。
7. **容量**：使用 section.capacity；课 total = Σ section.capacity。
8. **选择器**：学期列（relativeSemester）；已在同课任一分组志愿名单中的学生不可选。
9. **Demo**：候选人 ≥25；各组志愿 seed 尽量多但仍 ≤ 分组容量。
10. **保存 / 最终确认**：按分组保存；dirty 仅内部；有未保存则最终确认阻止。
11. **学生端第一轮**：提交志愿后进入选课队列；队列结束后状态为「待分配」（对应原「选课成功」语义，但不算真正选上）。本轮选课情况不展示「选课成功」「选课失败」；不展示已选学分文案（待分配不计入学分）。待分配不升级为选课成功；最终选上结果在选课历史体现。

## Open Questions (resolved)

- 容量按组各自 ✓
- 同课其他分组已志愿也不可再选 ✓
- Tab 顺序与默认：志愿 | 按轮次 | 按学生；默认志愿 ✓
- 抽屉布局对齐批次课程管理 ✓
- 搜索拆学号/姓名；添加学生左、容量右 ✓
- 批次文案「添加课程」含弹窗/空态 ✓
- 页说明 callout + 句号 ✓
- 第一轮：进队列；成功→待分配；不展示学分；不升为选课成功 ✓

## 来源：add-result-by-round-tab

## Decisions

1. 顶层 Tab：`按学生 | 按轮次`（移除按课程）。
2. 按轮次内：第一/二/三轮顶栏 Tab（`preselect` / `main` / `supplement`），切换重置页码与勾选。
3. 按轮次主表列：勾选、序号、批次名称、代码、名称、学分、本轮新增、已选/有效最大容量、已选新生/新生容量、已选老生/老生容量、操作（仅添加学生；无本轮名单入口）。
4. 去掉累计已选、剩余、使用率——与容量三列明细重复；容量三列复用批次课程页同一套 `getCourseAudienceCapacity` / 展示文案。
5. 行 `id` 用 `result-course-{courseId}` 以便批量删除仍调用 `removeAdminCourseRegistrations`。
6. 导出字段对齐合并后的列；添加学生弹窗传入 `roundKey`，提交走 `addRoundCourseStudents`。
7. 去掉顶部 sync callout 与工具栏「一键同步 Study Plan」按钮（两 Tab 均无入口）。
8. 按学生去掉状态列与状态筛选；入学批次展示为 `YYYY/MM`（demo 中 `YYMM` 如 `2409` → `2024/09`）。
9. 按轮次主表 必须NOT 提供「本轮名单」操作（不再打开 RoundResultRosterDrawer）。
10. 批次名称由课程 `batchId` 解析 `registrationBatches` 名称写入汇总行。
11. 添加学生弹窗主表：学号、姓名、性别、学院、入学批次、学生类别；无年级专业、分组名称。筛选去掉年级、专业、分组名称；默认仅学号/姓名，学院在展开行且默认收起。

## 来源：add-student-result-operator

## Context

学生端列表来自 `studentConfirmedCourses`；管理端 `addAdminStudentRegistrations` 未写该池、未记操作人。

## Decisions

1. **字段**：确认课可选 `operatorName`；有值显示，否则 `—`  
2. **列位置**：选课时间之后、操作之前  
3. **Tooltip**：表头 ⓘ（hint-popover），说明代选显示管理员、自选显示 —  
4. **Demo**：BUS201 / MPU3183 种子带 `AC Lee` / `AC Wong`；其余自选  
5. **代选写入**：若 `studentId` 为当前演示生，同步写入 `studentConfirmedCourses` 并设 `operatorName: 'AC Lee'`（demo 固定管理员名）  

## Risks

- [Risk] HMR 旧种子无 operatorName → Mitigation：reseed 条件检测代选样例缺失  

## Open Questions

（无）

## 来源：polish-result-course-source

## Context

选课结果已优先读 `studentConfirmedCourses`；缺 `sourceType`/`roundKey`；种子约 6 门且上限 8。

## Decisions

1. **同源**：结果表只 map `studentConfirmedCourses`（与我的选课 success 同一池）。
2. **来源**：`sourceType: 'round' | 'admin'`；round 时配 `roundKey`；管理员时必有 `operatorName`。
3. **Demo 10 行**：原成功半池保留为轮次自选（写 roundKey）；原代选样例 + 新增行标为 admin，凑满 10。
4. **列序**：选课时间 → 课程来源 → 操作人 → 操作。

## Risks

- 旧 HMR 状态缺来源字段：种子检测缺字段则重灌。

## 来源：remove-admin-waitlist

## Decisions

1. 仅下线管理端入口与页面；选课队列保留。
2. 流程指引：去掉 `cr-waitlist` 节点；阶段 I 文案改为「满员等退课后进队列、无候补」，不再挂候补页。
3. 删除孤儿学生候补页；不在本变更中重写 `studentRegistrationStore` 内未暴露的候补函数（无 UI 可达）。
4. `waitlist.*` 中仍被「有余量/已满」筛选复用的文案可保留。

## 来源：split-result-by-student-course-rows

## Context

按学生结果原为 monitor `schedule` 聚合一行。缴费未缴费底层 `feeRosterRows` 已是一门一行，主表仍聚合；按学生结果主表直接用明细粒度。

## Decisions

1. 行粒度：学生 × 课程（一门一行）；学生字段在多行重复。
2. 列：勾选、序号、学号、姓名、专业、入学批次、批次名称、课程代码、课程名称、学分、类型、教学分组、是否重修、课程来源。
3. 去掉：课程数、逗号拼接「已选课程」、学生合计学分列。
4. Demo：从 monitor schedule 展开；课程名/学分/类型/分组从 `selectableCourses` 按代码回填；`isRetake` demo 混入若干 true。
5. 代选：插入新明细行，不合并进已有学生行；`isRetake` 默认 false。
6. 删除：按明细行 id 移除（一门一删）。
7. 按轮次表去掉「本轮新增」展示与导出；内部 `roundNew` 可保留用于过滤。

## Open Questions

- 无

## 增量：批次顶栏与志愿名单分界（2026-07）

## Decisions

1. **页顶批次**：`selectedBatchId` 置于 GE 统计条之上；默认第一条 `active`（无则列表首项）；写入三 Tab 的 applied.batchId。
2. **搜索区**：去掉各 Tab 内批次下拉，避免双源。
3. **GE 统计**：暂不随批次变（全校汇总）。
4. **文案**：`volunteerCapacityLabel` →「志愿数量/课程容量」。
5. **名单底色**：按完整草稿名单序号，`< capacity` 浅绿，`>= capacity` 浅黄。

## 增量：全批次结果 demo + 下拉宽度（2026-07）

## Decisions

1. **全批次有数**：每个 `registrationBatches` 在三 Tab 均至少有若干可演示行；不为「空批靠后」做排序。
2. **缺课批次**：在 `selectableCourses` 用 `buildActiveBatchDemoCourses` 补 3～4 门轻量课（含分组）。
3. **种子粒度**：主批 `batch-2504-m1` 保持较丰富；其它批次每批取前若干门课挂志愿/轮次/学生明细，避免体量过大。
4. **下拉宽度**：结果页复用在线选课同款文案测量（最长批次名 + 箭头余量）。

## 增量：志愿名单随机排序（2026-07）

## Decisions

1. **随机排序**：工具行「添加学生」右侧；确认后对完整草稿洗牌；无 Undo；确认文案说明不可恢复。
2. **顺序保留**：取稿/保存/手动添加均不再强制 `sortVolunteers`；初始 seed 仍可用学期序生成。
3. **保存才落库**：未点保存的随机/添加/移出只改抽屉草稿；关闭未保存则丢弃，不写 `volunteers`。
4. **容量语义**：名单绝对序前 `capacity` 名为容量内（本课选上），其余为容量外；保存允许名单长度 > 容量。
5. **手动添加**：未满时追加到名单末尾（容量内末位）；已满拦截并提示先移出。
6. **脏检测**：学号集合或顺序变化均视为 dirty。

## 增量：志愿名单批量移出与姓名展示（2026-07）

## Decisions

1. **姓名展示**：`pickVolunteers` 超额分支姓名不再拼 `(n)`；唯一性仍靠学号后缀 `-x…`。
2. **批量移出**：序号前多选列（含表头全选当前页）；工具行「批量移除」；确认后按勾选从草稿移除；跨页勾选累加；未保存关闭仍丢弃。
3. **行内移出**：保留单行「移出」。

## 增量：按批次最终确认（2026-07）

## Decisions

1. **按批定稿**：`finalizeVolunteerConfirm(batchId)` 只写该批 `volunteerFinalConfirmedAt`；已有时间戳则拒绝再次确认。
2. **状态文案**：志愿 Tab 工具行展示「尚未最终确认」或「已最终确认 · 时间」，随页顶批次切换。
3. **只读**：本批已定稿（或第二轮已开始）→ 不可再调志愿；主表「志愿名单」入口禁用。
4. **脏检查**：最终确认仅拦截当前批次未保存分组。

## 增量：学生维度新增代选（2026-07）

## Decisions

1. **入口**：学生维度工具行，导出旁「新增」（`common.create`）。
2. **交互**：独立弹窗；一次一名学生（单选）→ 再选当前批次下未满员「课×分组」。
3. **满员**：分组 `enrolled >= capacity` 视为满员，不可选；提交时再校验。
4. **落库**：复用 `addAdminStudentRegistrations`，`courseSource = admin`（界面「管理员添加」）。
