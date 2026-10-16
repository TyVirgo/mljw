# 选课管理-学生加退课 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-adddrop-course-picker

## Context

`StudentAddDropView` 课程用 `<select>`；`CourseLibraryImportModal` 提供可复用的搜索表格弹窗，但为多选导入语义。

## Decisions

1. **新组件** `AddDropCoursePickerModal`：布局仿导入弹窗；`courses` 由父组件传入（即现有 `courseOptions`）  
2. **单选**：首列 radio；点行选中；确认 emit `courseId`  
3. **表单触发**：只读 input 显示「代码 — 名称」+「选择」按钮  
4. **列**  
   - 加课/重修：代码、名称、学分、类型、名额状态（有余量/已满）  
   - 退课：代码、名称、学分、教学分组、时间  
5. **标题**：`选择课程`；副标题可带申请类型文案  

## Risks

- [Risk] 与申请弹窗双重 modal 叠层 → Mitigation：picker `z-index` 高于申请弹窗  

## Open Questions

（无）

## 来源：polish-adddrop-label-intake-desc

## Decisions

1. 列表列与表单区块共用菜单口径「加退课/重修申请」。
2. `YYYY/MM` 选项按字符串/年月倒序；`getIntakeOptions` 改为 desc，范围批次随之更新。
3. 不调整「全部」「请选择」占位项顺序（仍在选项列表数据之前由 UI 渲染）。

## 增量：学分方案 B + 申请锁名额不排队

### Decisions

1. **选课弹窗学分（方案 B）**  
   `AddDropCoursePickerModal` 展示两组胶囊：`[GE 已选/要求] [文][商][理] | [ME 已选/要求] [文][商][理]`。GE 文商理用 `getTermGeElectiveCategoryBars`（之和对齐 geMax）；ME 用 `getTermGeCategoryBars`。

2. **排队边界**  
   `runRegistrationQueue` 仅用于学生在线选课提交。加退课学生提交与管理端审批通过 **均不** 打开选课排队蒙层。

3. **锁名额**  
   提交含 Add/Retake 且有余量时 `holdAddDropSectionSeat`（`section.enrolled + 1`）；取消/拒绝 `releaseAddDropSectionSeat`。审批通过写已选结果时不再二次占座。

4. **延迟缴费**  
   通过且有费用：`paymentDueAt = 通过时刻 + getPaymentGraceDays()`（CR107，默认 2）；写入申请与缴费名单占位行。

## 增量：加课文商理可见性 + 审批列表展示

### Decisions

1. **ME 默认文科、按学生科类过滤**  
   `resolveSchoolElectiveCategory`：未显式标注的 ME → `arts`。演示生 `schoolElectiveCategory` 默认 `arts`。ME 仅当课程科类与学生一致时可见；GE 不按学生科类过滤。

2. **加课候选覆盖 GE 文商理**  
   加课种子在 ME（文科）之外补齐 GE 文科 / 商科 / 理科各至少一门。冲突演示只保留 COMP201 分组 03（与已选 COMP101 周五时段重叠）。

3. **审批冻结列随勾选列存在与否切换**  
   有勾选：`serial.left = 40`、`applicationNo.left = 88`。无勾选：`serial.left = 0`、`applicationNo.left = 48`。状态列给 `min-width`，避免被申请单号盖住。

4. **去掉审批学分列**  
   `getAddDropApprovalListColumns` 不再拼接 `credits`（学生端本就没有）。

5. **上课时间地点**  
   容器允许段与段之间换行；`.cr-time-venue-line` `white-space: nowrap`。`classTimeVenue` 列不再套表格单元格的 `nowrap`。

6. **超出学分决定费用与账单**  
   超出学分由申请字段或「当前学分 + 净加学分 − 学分上限」推导，**不得**用账单金额反推。超出 = 0：`billAmount = 0`、`billStatus = none`（列表账单「—」）。超出 > 0：保留或按超出学分生成费用与缴费状态。重修列表展示与加课同一口径（超出才有费）。

## 增量：选择器状态冻结 + 审批/学生详情

### Decisions

1. **选择器**  
   `AddDropCoursePickerModal` 默认 `pageSize = 20`；「状态」列 `position: sticky; right: 0`。

2. **审批详情瘦身**  
   删除 `student-card`（专业/入学 · 学分）与 `validation-box`。校验仍可在审批动作里用，不在详情展示。

3. **必填展示字段**  
   `academicSession` 缺省补 `2026/04`；`contactPhone` 缺省取学籍手机号或 demo 号码。不得显示「—」。

4. **详情课程拆列**  
   加课 / 退课 / 重修详情均为两列：左课程名称、右课程编码。列表「添加/退课/重修课程名称」仍为「编码 + 名称」。

5. **费用**  
   详情课程分区不再展示「预估费用」；金额用 `formatAmountRmb`（`{n} RMB`），覆盖列表费用列、申请表费用块、详情费用预估、单价 tip。

6. **声明**  
   详情复用申请表 `declaration-box`（`#fffbeb` 底、类型说明、`declarationText`、只读勾选 + 同意文案）。已提交申请默认已勾选。

## 增量：重修节先选本学期课（2026-08）

### Context

重修节原先先选往期成绩单再填本学期课，与加课「先选课再带回信息」相反；「曾修课程」与本学期课号重复展示。

### Decisions

1. **字段**  
   表单不再展示「从往期成绩单选择」「曾修课程（课号与课名）」。`previouslyTakenCourse` 仍可由成绩单匹配写入提交快照，详情不再单独展示该行。

2. **顺序**  
   本学期重修课程 → 曾修成绩 | 曾修学年学期 → 重修类型 | 课程分组 → 起止周、上课时间地点、教师、学分、超出学分、费用。

3. **曾修学年学期**  
   `getPreviousAcademicSession`：相对申请 `academicSession`，02/04/09 上推一学期（`04`→同年`02`，`09`→同年`04`，`02`→上年`09`）。打开重修表单即默认；选课不覆盖为成绩单学期。

4. **曾修成绩**  
   选本学期课后按 `retakeCourseId` 匹配成绩单填成绩，并默认重修类型（F/M→挂科重修，其余→刷分）。选课器仍只列可重修课。

## 增量：屏蔽加退关联（2026-08）

### Decisions

1. **可见类型**  
   `ADD_DROP_TYPE_TABS` / 审批筛选项仅为 Add、Drop、Retake。`type === 'AddDrop'` 不进学生列表、审批列表、Tab 计数与导出。

2. **闸门**  
   窗内/白名单 `allowedActions` 不再拼出 AddDrop；提交 AddDrop 按不允许处理。表单与 demo 种子可暂留，便于以后打开。

## 增量：重修节对齐问卷 SECTION IV（2026-08）

### Decisions

1. **课名**  
   问卷 Q16 曾修课名由本学期重修课程承担，不单独展示。

2. **成绩 / 学期**  
   必填下拉：成绩用 `GRADE_EARNED_OPTIONS`；学期用申请学年学期选项（缺则补 `PREVIOUS_SESSION_OPTIONS`）。选课带回后可改；学期默认上一学期。

3. **时间地点 / 教师**  
   选分组带回；空则输入框 + 问卷示例 hint。提交必填。

## 增量：审批历史账单明细 / 催缴 / 延期（2026-09）

### Decisions

1. **挂载**  
   仅管理端审批 **历史 Tab**；不新开菜单。只读账单明细对齐学生课程缴费课级已缴/未缴，无支付操作。

2. **催缴门槛**  
   未缴且剩余 **&lt;24h**（含 &lt;12h）显示「发送邮件提醒」；&lt;12h 样式更醒目。演示 mock 发送。

3. **重新生成订单**  
   超时未缴可自定义新截止；该申请下全部未缴课统一写回 `paymentDueAt`（申请 + 缴费名单 + 课程缴费 store），并取消相关 open/expired 订单锁定。

4. **数据**  
   优先 `studentCoursePaymentStore` 按 `sourceRef`/`applicationNo`；缺则回落申请费用项 / 缴费名单。

## 增量：审批历史缴费 UI 打磨（2026-09）

### Decisions

1. **文案**  
   列名与明细标签为「缴费剩余时间」；未超时统一 `{d}天{h}小时{m}分钟`，不加「剩余」前缀。

2. **Teleport 按钮**  
   弹窗底栏在组件内复刻 `.btn` / `.btn-primary` / `.btn-outline`（与 `MonitorRemindModal` 同因）。

3. **操作列**  
   `flex-wrap: nowrap` + 加宽 sticky 操作列，避免催缴/延期折行。

## 增量：加课选择器学分分行 + 学生列表解冻（2026-09）

### Decisions

1. **学分条**  
   选择课程弹窗本学期学分：GE 组一行、ME 组一行；去掉组间 `|`。

2. **学生列表**  
   加退课申请列表取消序号/申请单号/状态/操作的 sticky；列少时冻结收益低。

## 增量：重修切换保留 + 学期超分类提示 + 曾修入表（2026-09 §32）

### Decisions

1. **needDrop 切换**  
   同主类型仅切「是否退课」时只清退课节（是→否）；否→是保留重修/加课已填。主类型互切仍走 `clearHiddenSectionFields`。

2. **重修类型**  
   跨池切换仅清重修课清单；下拉与申请类型同高 `form-control`。

3. **超出学分 vs 费用**  
   「超出学分」= max(学期类别/帽超额, billableCredits)；费用仅毕业超额。

4. **白名单 footer**  
   点名超限学期类别（如「已经超出本学期文科学分要求」）。

5. **曾修成绩**  
   并入重修表行内列；移除列表头「操作」。

## 增量：学期三卡学分条 + 退课以必修为主（2026-10）

### Decisions

1. **三卡内容**  
   - GE 学期：`已选/要求`（geMax）  
   - ME 学期：`已选/要求`（meMax）  
   - 必修：仅 `已选 n`（无分母）  
   不展示毕业行、不展示分类胶囊。

2. **挂载**  
   共享 `AddDropTermCreditStrip`：申请说明与「申请信息」之间；选择课程弹窗学分区。同源投影（确认+必修底图 − 拟退 + 拟加）。

3. **退课池**  
   必修底图（`studentRequiredCourses` / CORE）优先列出；确认池选修仍可退但排后、demo 较少。修订「可退仅选修」。

4. **四列排版（2026-10）**  
   标题上行；列序 GE / ME / 选修学期已选（ge+me current）/ 必修学期已选。

5. **列宽自适应 + GE≤6 同源 + CORE 文案（2026-10）**  
   - 学分条面板 `width:100%`，四列 `repeat(4, 1fr)` 横向均分拉满（修订先前 max-content 不拉满）。  
   - 加退 `scope=confirmed` 学分累计排除 `sourceType=admin`，与 R3 `listRoundStatusCreditCourses` 同源；`geMax=6`。拟加 GE 使学期 GE 已选 > geMax 时选课器与提交硬拦。  
   - `getRegistrationTypeLabel('CORE')` →「必修课」（i18n `types.CORE`）。

6. **退课筛选 / 名额列 / 拟退计费（2026-10）**  
   - 退课筛选：`courseTypeFilterOptions` 在 ME/GE 外追加 CORE。  
   - 名额列：`isDrop` 时不渲染「可选名额/总名额」。  
   - `planRemainingForFee`：`termCreditGate.dropLines.length > 0` 即 boost，修复加退表单打开加课槽时 `action='Add'` 不释放拟退的问题。

7. **退课学分 2×2 + 学分条六列（2026-10）**  
   - `buildDropCreditBreakdown`：mandatory / me / ge 三分；`isMandatoryAddDropCourse` 优先。表单 `fields-row-2` 四格；详情 field-grid 自然 2×2。  
   - `buildAddDropTermCreditStrip` 增加 `gradGe`/`gradMe`；展示值统一 `已选/要求`。面板 `repeat(6, 1fr)`。

8. **毕业已选顺序 + 退课列宽 + 本学期基线（2026-10）**  
   - 毕业 i18n / 数值改为已选/要求。  
   - Drop 表加 `data-table--drop`：列宽自适应重分配。  
   - `termCreditStripBaseline.gradGe/MeCurrent` = 学期 GE/ME 已选（本学期确认、不含 prior）；`grad*Max` 仍用培养方案要求。

9. **ME 计费总分口径（2026-10）**  
   - `remainingForTypeCategory`：ME 与 GE 一样只读总分剩余（`meRemaining` / `geRemaining`），忽略 `meCategory`。  
   - `buildAddDropPlanRemaining.meRemaining` 对齐培养方案 `meRequired − meEarned`（与 GE 总分算法对称）。  
   - `consume`/`boost` 仍可维护子类桶（展示/兼容），计费不读子类。

10. **弹框冻结 + 搜索分栏收放（2026-10）**  
    - 申请弹框：`adddrop-sections__pin`（说明+学分条）+ `__scroll`（表单节）；modal-body `overflow:hidden` 分区滚。  
    - 选课器：对齐列表页 `list-page-search.css`——首行 `search-fields`（代码/名称/学分）+ 右上 `search-actions`（查询/重置/收起）；次行展开校选课类型、课程类型。

11. **学分条七列 + 毕业标签换行（2026-10）**  
    - `buildAddDropTermCreditStrip` 增加 `totalSelected = elective + mandatory`。  
    - `AddDropTermCreditStrip`：`repeat(7, 1fr)`；prop `stackGradSelectedRequired` 仅申请弹框为 true，GE/ME 毕业 label 分两行。

12. **加退「我的课表」对齐我的选课（2026-10）**  
    - 主页课表抽屉改用 `listMyResultCourses` + `buildMyResultSchedule`，`legendMode="myResult"`；废弃 `buildPreviewSchedule(required+confirmed)` 的 register 三色图例。  
    - 槽位过滤：排除 `pendingDropCodes`（课号/courseId），与退课池「已选全部可退」语义一致；拟加不注入「本轮」虚线（加退无志愿轮次）。  
    - hint 文案改为含四类已选课、拟退不出现在预览。

13. **详情学分/费用对齐申请弹框（2026-10）**  
    - `AddDropApplicationDetailBody` 加课/重修表后：总学分 + 超出学分 + 预估费用 + SST（与 `AddDropApplicationFormSections` 同学分区）。  
    - `hasFeeBoxContent`：仅 `feeEstimate.total>0` / SST>0 / items.length>0 时渲染费用预估节。  
    - 预估费用短字段与合计读 `feeEstimate`；合计不再回退孤立 `billAmount`（避免「预估 0、合计 2000」）。

14. **学期超出 / 毕业超出拆分（2026-10）**  
    - `sumGeMeTermStripExcess(strip)`：仅 `strip.ge` / `strip.me` 的 `max(0, current−max)`。  
    - 表单 `formTermCreditExcess` 改用该函数（废止 `sumTermCategoryCreditExcess` + `computeTermCreditExcess` 展示口径）；提交硬拦学期总帽逻辑可保留。  
    - 表单/详情字段：学期超出学分 | 毕业超出学分（计费）= `feeEstimate.billableCredits`。  
    - payload：`termCreditExcess` + `billableCredits`；`excessCredits = max(term, billable)` 供列表列。

15. **重修必修 + 课程组替代（2026-10）**  
    - `listRetakePickerCourses`：成绩单原课 → 同课 +（非 CORE）组内替代开课；挂 `selectionGroup` / `replacesOriginals` / `groupMaxGrade`。  
    - GE：虚拟 `selectionGroup`（全部本学期 GE）；ME：批次 `selectionGroups`；CORE：仅同课。  
    - 选课器重修模式：展开全部分组；展示课程组列（对齐 Register）；曾修列展示原课履历 + 组内最高分。  
    - 行字段 `replacesCourseCode` / `isSubstituteRetake` 写入 addLines。

16. **重修 Tab + 整门计费（2026-10）**  
    - 选课器：`retakeTypeTab` = core | ge | me；过滤 `listRetakePickerCourses`；学分条展示见 §21（含 Retake）。  
    - `estimateCourseFee`：Retake/RetakeDrop → `billableCredits = credits`（含 CORE）；Add/AddDrop 仍按毕业剩余。  
    - 表单/详情重修节去掉学期超出、毕业超出字段。

17. **重修选课器 GE 无底色 + 曾修按考过 + 名额列（2026-10）**  
    - `selectionGroupRowClass`：虚拟 GE 组（`ge-virtual-all`）不挂 tone；ME 仍交替底色；仅重修选课器。  
    - `listRetakePickerCourses`：替代课 `retakeHistory` 仅挂本课号成绩单；无本课成绩则空。选课器 `retakeHistoryLines` 仅输出本课履历，无则「-」。  
    - 重修模式：曾修列 + 「可选名额/总名额」并排；学期超学分硬拦（`isRowCreditBlocked` 仍拦截）。弹框 `min-width` 提到约 1280px。

18. **必修对齐课表 + 横滑 + 加课 Tab（2026-10）**  
    - Demo：`course-phys101` type=CORE；补 `course-math101` 开课 + 成绩单挂科；`listRetakePickerCourses` upsert 用成绩单 type/`sourceType` 覆盖课库。  
    - Tab 过滤：CORE 含 `type=CORE` 或 `sourceType=required`。  
    - 加课选课器复用同类 Tab；`ELIGIBLE_ADD_SEED` 含 CORE（如 math101 prior_drop）。  
    - `.table-wrap { overflow-x: auto }`；表 `min-width` + `table-layout: auto`。

19. **重修 polish：绑课表必修 / GE 去组列 / 对齐与悬停（2026-10）**  
    - `mergeRetakePickerWithTimetableRequired(pool, studentRequiredCourses)`：按课表必修并入 CORE；开课优先课库，附本课 `retakeHistory`。  
    - `showSelectionGroupColumn`：GE Tab 为 false。  
    - 名额列：无课级 rowspan；`text-align/vertical-align: middle`。  
    - 去掉 `tr:hover` / `tr.selected` / sticky 悬停的 `#eff6ff`；保留 tone-0/1。  
    - 课级 `td` 补 `border-left/right`。

20. **名额对齐 / 曾修按教学班 / 必修无课程组（2026-10）**  
    - 名额列与同行对齐；右侧冻结见 §22。  
    - 成绩单补 `sectionCode`；选课器曾修列按 `section.code` 过滤，取消课级 rowspan。  
    - `showSelectionGroupColumn`：仅 `courseTypeTab === 'me'`。

21. **重修搜索单行 + 学分条 + 表宽（2026-10）**  
    - 重修/加课 Tab 模式：四条件 + 查询/重置单行；隐藏「更多」。  
    - `showCreditProgress` 含 Retake；投影仍用 `pickerProjectionCourses`。  
    - 加课表格 `width: 100%; table-layout: fixed`；重修见 §22。

22. **学分条置顶 / 右冻结 / 跨 Tab 勾选（2026-10）**  
    - 模板顺序：搜索 → 学分条 → Tab → 已选文案 → 表。  
    - `selectedRows` 从 `flattenedRows` + `pickedRowKeys` 解析（不限当前 Tab）。  
    - 重修表 `data-table--retake-hscroll`：`max-content` + 横向滚动；曾修/名额 `position: sticky; right`。

23. **重修同课单分组 + 必修无名额（2026-10）**  
    - `isRowDisabledBySibling` 对 Retake 启用（按课号互斥分组）；同 `selectionGroup` 不同课可多选。  
    - `showSeatOrRetakeColumn`：重修且 `courseTypeTab === 'core'` 时 false。  
    - 修订 §25「重修关闭同课单分组锁」。

24. **详情学分要求条 + 本次申请三学分（2026-10）**  
    - submit：`termCreditStrip` = 表单当时 `formTermCreditStrip`；`applicationCredits` 仍可持久化但不展示。  
    - DetailBody：学生信息后挂七列条；「本次申请学分」三格见 §25 撤销。  
    - 修订「审批详情不展示学分摘要」：仅禁旧 x/y 条，允许七列条。

25. **类型文案 + 详情条表头 + 去掉三格（2026-10）**  
    - i18n：`approval.type.Add/Retake(/AddDrop/RetakeDrop)` → 加课（退课）/ 重修（退课）；Drop 仍为退课。  
    - DetailBody：去掉 applicationCredits UI；strip 不传 `stackGradSelectedRequired`，表头 `nowrap` + 略小字号。

26. **审核行内决策 + 默认出账（2026-10）**  
    - `AddDropApprovalModal`：行内 `approved|rejected|update_required` + `lineCommentsMap`；批量按钮同步三态。  
    - 提交：`resolveActionFromLineDecisions`；`generateBill` 仅在 Approved/部分通过且 `showGenerateBill` 时恒 true。  
    - `showLineOps` 时隐藏底部 form-table；`targetCount>1` 无行表时保留整单区（无账单勾选）。

27. **详情去审批钮 + 审批弹窗布局（2026-10）**  
    - `AddDropApprovalDetailDrawer`：footer 仅关闭；去掉内嵌审批入口（列表行「审批」打开 `AddDropApprovalModal`）。  
    - 弹窗标题改 `courseRegistration.approval.modalTitle`（中文「审批」），避免 `tr('Approval')`→「审核」。  
    - 去掉 `itemsSummary` section-bar；保留批量三钮。  
    - 列：`table-layout: auto`；类型列 nowrap 完整文案；`col-op` / 意见框约减半宽。  
    - `enrichAddDropScheduleItem` + queue seed 补 `courseName`（课库 demo 对照）。

28. **行内意见宽恢复 + 行高减半（2026-10）**  
    - 撤销 §27 意见框 160px 硬锁；`line-op-stack` / 意见框恢复约 `min-width: 200px`。  
    - `.line-comments-input` 覆盖 `.comments-input` 的 120px：`min-height` 约 40–52px、减小 padding/footer；`rows="1"`。  
    - 整单 form-table Comments 仍用通用 `min-height: 120px`。

29. **审批文案对齐通过/不通过/驳回（2026-10）**  
    - `appStatus.Approved`：已批准→已通过（en: Passed）。  
    - `lineApproved/Rejected`：已同意/已不同意→已通过/不通过；新增 `lineUpdateRequired`：驳回。  
    - `AddDropApplicationDetailBody.lineDecisionLabel` 映射三态；`showLineDecisionColumn` 含 `update_required`。  
    - 范围仅 `courseRegistration.approval`，不改白名单 entryStatus 等。

30. **申请弹框学分条单行 + 加宽（2026-10）**  
    - FormSections：去掉 `stack-grad-selected-required`。  
    - `AddDropTermCreditStrip`：label `white-space: nowrap`，字号略缩。  
    - `StudentAddDropView` `.cr-adddrop-modal`：`720px` → 约 `min(960px, 96vw)`。

31. **审批公共 Comments（2026-10）**  
    - 修订 §26：有行表时行内仅三态 radio；去掉 `lineCommentsMap`。  
    - `showLineOps` 时在表下展示共用 Comments（`comments` + 常用意见），不展示底部整单 Action。  
    - `resolvePayloadFromLines` 用 `comments`；不通过/全驳回校验公共意见。  
    - 批量无行表仍为整单 Action + Comments。

32. **审批名额列 + 操作单行 + 提示文案（2026-10）**  
    - `AddDropApprovalModal`：操作列前加「可选名额/总名额」；enrich 补 `remainingCapacity`/`capacity`。  
    - `.radio-group.line-op-radios` 提高特异性强制 `nowrap` 单行。  
    - `StudentAddDropView`：去掉 AddDrop/RetakeDrop 联合 callout。  
    - i18n `pickerAddEligibilityTip` 更新必修/选修分述文案。

33. **名额列表头加宽 + 审批着色（2026-10）**  
    - `AddDropCoursePickerModal`：`.sticky-status` `7.5em` → 约 `10em`；曾修列 `right` 同步。  
    - `AddDropApprovalModal`：名额用 `seat-status open|full`（绿/红）。

34. **审批列表专业列（2026-10）**  
    - `getAddDropApprovalListColumns`：在 `submittedAt` 前插入 `programme`。  
    - `AddDropApprovalView`：表头/单元格读 `row.programme`（i18n 复用 monitor.programme）。

35. **列表搜索扩展（2026-10）**  
    - `filterAddDropQueue`：支持 `status` / `billStatus` / `academicSession` / `studentId` / `studentName` / `keyword`(单号)。  
    - 审批页 searchForm 扩展；待审批状态 Pending|In Review，历史 Approved|PartiallyApproved|Rejected|Cancelled。  
    - 学生 `StudentAddDropView`：加 `academicSession` / `billStatus` / `applicationNo`。  
    - 两端搜索：首行常用条件 + 查询/重置/`toggle-link`；次行 `search-row-secondary`（`searchExpanded` 默认 true）。  
    - i18n：`approval.bill.none` → 无账单。
