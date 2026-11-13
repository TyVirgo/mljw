## 背景

整合历史增量，仅保留当前应然行为。

## 目标 / 非目标

**目标：**

学生端加退课主流程

**非目标：**

不重做整页原型

## 决策

1. 以当前代码为真源
2. 全中文
3. 历史包见 SOURCES.md
4. 退课学分摘要：共用 i18n `coursePickerSelectedDropCredits`；数字口径与弹窗/表内课程一致（退课前=当前可退池全部课程学分总和，退课学分=勾选/拟退行合计，还剩=前−退且≥0）；**不得**再用学分条 `termCreditStripBaseline` 的 GE+ME+必修已选作「退课前」。申请表传入 `dropPoolCreditsTotal`（与退课 `courseOptions`/`listMyResultCourses` 同源）；学分条仍单独用 `termCreditStripBaseline`
5. 样式：无选中灰字；有选中整句红字 `#dc2626`
6. 课程表明细首列序号（1-based）；`lines-table-wrap` 保持 `overflow-x: hidden` + `table-layout: fixed`，时间地点多行折行，避免横滑
7. 重修公共区顺序：学分费用行 → 费用预估框 → 重修补充说明
8. 详情重修表「同课号重修」列：与表单 `resolveRetakeStudyModeKey` + `studyModeLabel` 同源
9. 学分条投影：`buildAddDropTermCreditStrip` 对加/退/重修行统一 `enrichCourseForCreditStrip`；重修选课器在 locked 原课池下投影时，保留本弹窗课表匹配不到的表单已选重修行（跨 Tab 一致）
10. 学生详情学分/费用：与审批队列同一申请对象；展示走 `ensureApplicationDetailCredits` / 审结后的 `feeEstimate`，与历史详情一致
11. 课程缴费整单：与审批后 `feeEstimate` 课目/金额 reconcile，不混入其它申请或 0 元加课
12. 学生申请列表：`status` 后增 `bill`，文案与审批历史 `billStatus` 同源
13. 二次申请门控：存在未审真实提交单，或已通过/部分通过且 `billStatus=pending` 有应付 → 不可提交。未审与待缴判断均须 `isStudentSubmittedAddDropApplication`（`adr-stu-`），demo 种子不计入「第一次/二次」
14. **开窗体验：** 「发起申请」在窗口期内可打开表单；若未审或待缴门控触发，窗内提示原因且 `formOpsDisabled`，提交按钮禁用（不拦在门外）
15. **学分一致：** 当前生审结且已落课/已付款/已拒绝的详情学分条，与二次申请顶栏均使用课表确认态快照（`buildLiveConfirmedTermCreditStrip`）；有应付未缴详情仍可用行决策投影预览
16. **重修单课互斥：** 重修选课器（`failed` / `improve_grade`）本窗 `multiple=false`，行控件为 **radio**（非 checkbox）；一门原课至多一门开课；表头 MUST NOT 渲染全选。加课/退课仍可多选。实现：`pickingFor==='retake'`（及重提）传 `multiple=false`；`isRowDisabledBySibling` 仍可辅以置灰
17. **学分条配色：** 表头/默认数值黑字；一级未满灰底、选满底不变仅 `value` 绿、超出仅 `value` 红；二级（第3/5列）学期与毕业均橙底黑字。改 `AddDropTermCreditStrip` 即可全入口一致
18. **退课弹窗选修 tip：** `AddDropCoursePickerModal` 退课态 `selection-meta` 旁 `tip-icon`；i18n 说明开放期内选修退课规则；不禁选、不置灰（demo 按已过选课时间）
19. **落下 tip：** `situationDeficit` 文案为截止到当前学期落下未修；始终按类别出分（无则 0）；demo `DEMO_PRIOR_EARNED_CREDITS.mandatory` 调至约落下 10；不再用「毕业累计还剩」口径切换 `situationFull`
20. **换组锁按学期：** `isCoreOtherSectionReaddBlocked` 增加当前申请学期；原上课学期均早于当前 → 不锁；含当前学期原组 → 默认同组，白名单可换组；origin 行须带 `originalAcademicSession`
21. **落下 tip demo：** 必修/GE/ME 展示约 4/4/3（调 prior 与 tip 口径同源）
22. **选修有效上限：** 硬拦比较 `projected > termMax + deficit`（deficit=含拟退不含本窗拟加的固定 base）；学分条学期格展示合计分母（见 §31）；超限文案点明合计上限及分项
23. **加课 ME 组视图：** 资格池保留孤立 ME；对未完成 minPick 的课程组展开：已选课置灰展示，未选可修课可选；与孤立课同 Tab 不互斥
24. **加课 ME 组表展示：** 对齐在线选课：`sortSectionRowsBySelectionGroup` 保同组相邻；`mergeRetakeSelectionGroupSpans`（加课亦用）合并课程组列；有组时不做破坏组邻接的上课学期重排；分页 `groupAware` 不拆组
25. **落下 tip 动态：** `resolveAddDropSituationCreditGaps` 对必修/GE/ME 均为「要求 − prior − 条上已选」；条随勾选投影 → tip 变；硬拦因修未修取「含拟退不含本窗拟加」以免与学期 current 双计
26. **孤立 ME 课程组列：** `attachSelectionGroupColumnSpans` 无组时按课 rowspan，格内单一「—」
27. **重修曾修列：** 课级履历（不按教学班滤）；`retakeHistory` 课级 rowspan；有成绩不展示「—」；表头/单元格移到一级末（类别/原上课学期后、课程分组前）
28. **不及格 Tab 计数：** 原课区三 Tab 标签附「（N门课程）」；N 来自当前重修类型池按类别过滤的门数
29. **加课 ME 组门数帽：** 展开未完成组含 3选2/4选3/2选1；本窗勾选+已确认达 minPick 后组内其它课置灰并 tip
30. **学期超出：** `sumGeMeTermStripExcess(strip, catchUp)` = Σ max(0, cur − (termMax+因修未修))；标签 tip 说明仅白名单可超才展示（demo 仍展示字段）
31. **学期格口径：** 学期行只展示 `已选/学期要求`（不含因修未修括号）；硬拦仍用学期要求+固定 catchUp base
32. **学分条列宽：** 矩阵表铺满容器、禁止横向滚动；同列上下共用列宽；表单/选课器/详情/审批同源
33. **必修学期要求 demo：** `mandatoryMax` 默认 9
34. **选修合计 / 总合计：** 选修课合计=GE+ME；总合计=必修+选修合计；学期与毕业均 `已选/要求`
35. **学分要求矩阵（增量 m）：** 3 行×5 列语义表；行表头「学期/已选/要求」「毕业/已选/要求」「未修/因修」；未修=条上动态落下，因修=该类学期已选+未修；前三列灰底 tone，后两列橙底
36. **矩阵容器（增量 n）：** 面板 MUST NOT 使用 `cr-r1-credit-panel`（R1 五列 Grid 与单表冲突）；自带 border/radius/背景，table 铺满
37. **课程预览（增量 o/p）：** 说明 callout 右上「课程预览」→ 抽屉复用 `StudentSchedulePreviewPanel`；无本单行时 slots 与外面「我的课表」一致；有行时仅叠当前 `form.addLines/dropLines/retakeLines`（不叠历史未审单）；hint 写明「本单参考、非最终课表」；`layer` 仍 required/elective；虚线色靠 `applicationOp`；图例 `addDropPreview`
38. **课程预览 UI（增量 q）：** 预览抽屉 overlay z-index 高于申请弹窗（≥1200）；header 仅标题+学号姓名，不挂长 subtitle；内容区置顶顺序=五项图例 → 浅蓝短 tip → 课表格；tip 文案短句一份（未勾选≈我的课表 / 勾选后本单投影 / 仅供参考）；始终 `legendMode=addDropPreview`，不因空单回退 `myResult`
39. **课程预览文案与顺序（增量 r）：** 标题仅「课程预览」；顺序改为浅蓝 tip → 五项图例 → 课表格；图例虚线三项文案为「加课申请/退课申请/重修申请（虚线）」；tip 与图例均不用「本单」
40. **退课学分标签（增量 s）：** `fieldDropMandatoryCredits` / `fieldDropMeCredits` / `fieldDropGeCredits` 中英标签后缀「（分）」/ credits 口径
41. **预览冲突=选课基线（增量 s）：** `legendMode=addDropPreview` 时排班分两组：占用组=保留∪加课∪重修；幽灵组=退课申请。冲突 `conflictPeers` 与 lane 仅在占用组内计算（与 `pendingDropCodes` 排除拟退后的选课基线同语义）；退课格可展示但不参与冲突、不把加/重修挤成并排冲突态
42. **预览不画退课（增量 t）：** 投影不再输出 `applicationOp=drop` 格；图例仅必修/选修/加课申请（虚线）/重修申请（虚线）；去掉浅蓝 tip。`buildAddDropApplicationSchedulePreview` 用 `pendingDropCodes`（及 dropLines）剔除 base；选课 `scheduleBaseline` 与预览 base 同源 `listMyResultCourses`。选课 `conflictInfo` 基线叠加本窗其它已勾加/重修与表单另一侧加/重修，禁止互撞
43. **退课池同源（增量 u）：** 退课 `courseOptions` 改为 `listMyResultCourses(studentId)`（排除未审底账已拟退），不再只用 `studentRequiredCourses ∪ enrolled选修`；与预览/冲突基线同一集合，已批准申请注入的加/重修可退
44. **空预览骨架（增量 v）：** `StudentSchedulePreviewPanel` 在 `schedule.length===0` 时仍渲染 `WeekScheduleGrid`（空 slots + 图例），保留周一～日时间轴
45. **同侧已确认互检（增量 v）：** `peerAddRetakeBaselineSlots` 除本窗勾选与另一侧外，并入表单同侧已有加课/重修行（重修弹窗含 `retakeLines`）；与 `scheduleBaseline` 一并硬拦，预览不再出现「能选却互撞」的重修对
46. **说明区紧凑（增量 w）：** 仅在 `.adddrop-sections` 内收紧 `:deep(.cr-callout)` 的 padding/margin/gap，以及 `.notes-title` / `.notes-list` 行距与条目间距；不改全局 `CourseRegistrationCallout` 默认样式与说明文案
47. **预览按钮位置（增量 x）：** 「课程预览」从说明 callout 右上移到申请弹窗 `modal-actions` 左侧；右侧仍为取消 / 提交申请
48. **说明标题间距（增量 x）：** 在 w 基础上再压 `.adddrop-notes-head` / `.notes-title` ↔ `.notes-list` 间距（含 callout 内 ol 的 margin-top）
49. **拟退对齐加课池（增量 x）：** `mergeEligibleAddWithPendingDropCores` 以本单拟退的 `sectionCode`（课程分组）与 `academicSession`/`originalAcademicSession`（原上课学期）覆盖种子；MATH101 等当前学期课表拟退不得仍展示错位的「09 种子退课」原组。换组锁对当前学期拟退：默认同组，其它分组禁选（沿用 `isCoreOtherSectionReaddBlocked`）
50. **拟退移除闸门（增量 x）：** 若移除某拟退行后，已勾加课/重修会与该课时段冲突，或学分超限，则该行「移除」置灰；tooltip 点名须先移除的加课/重修课程代码。随表单勾选实时重算
51. **预览虚线色（增量 x）：** 加课申请虚线 `#ea580c`（橙）；重修申请虚线 `#ca8a04`（黄）；必修/选修底色不变，`is-required`/`is-confirmed` + `is-op-add`/`is-op-retake` 均须可见虚线；图例色块同步
52. **虚线加粗无底（增量 y）：** 加课/重修虚线边框加粗（约 3～4px）；图例 swatch 与课块均 MUST NOT 使用橙/黄填充底，仅虚线描边；课性实心底色（必修深蓝/选修浅蓝）保留
53. **取消存草稿（增量 y）：** 申请弹窗「取消」若表单有内容，ConfirmDialog 询问是否存入草稿；确认则 `status=Draft` 写入队列（不占座、不计入未审门控）；否认则丢弃关窗。草稿列表行提供「编辑」回填表单；提交后变待审批（可覆盖原草稿 id）
54. **学生列表四态（增量 y，aa 修订）：** 展示映射初版曾把 `Rejected`/`PartiallyApproved` 一律已驳回；**以增量 aa 第 58 条为准**（按行 `update_required` 判定）。筛选与徽章按四态；`Draft` 不挡二次发起
55. **取消存草稿脏检查（增量 z）：** 打开申请窗时记录 baseline 快照；取消时仅当表单相对 baseline 有 diff 才提示存草稿；无 diff 直接关窗
56. **详情/老师历史状态同步（增量 z）：** `AddDropApplicationDetailBody`（学生+老师详情）与老师历史 Tab 共用四态映射文案；老师历史筛选项为已驳回/已结束/已取消（+必要时待审批键）；`Cancelled` 含学生取消与老师中止
57. **已驳回重新提交（增量 z，aa 修订）：** 列表「重新提交」打开弹窗；**仅** `lineDecision === update_required`（驳回）行显示「修改」；`approved`/`rejected`（通过/不通过）只读；确认后以**全部最新 items** 写回并置 `Pending`
58. **行决策驱动终态（增量 aa）：** 展示映射改为读全部课程行——任一行 `lineDecision === update_required`（驳回）→已驳回；终态且无驳回行（仅 `approved`/`rejected`）→已结束（覆盖原 `Approved`/`PartiallyApproved`/无驳回的 `Rejected`）。老师审批提交允许驳回与通过/不通过混选，有驳回时整单写 `status=Rejected` 并保留各行决策；无驳回时按通过/不通过汇总为 Approved/PartiallyApproved/Rejected 且展示已结束。`isAddDropLineEditableForResubmit` 仅 `update_required`；`rejected`（不通过）只读。demo：已驳回样例 items 至少一条 `update_required`
59. **重新提交弹窗补齐（增量 ab）：** demo/enrich 补齐 `courseName`+`type`（及 GE 校选类）对齐课库；时间地点仅展示首段+`…`，`title` 全量；弹窗顶部挂 `AddDropTermCreditStrip`，决策取自当前 `workingItems.lineDecision`（与审批投影规则一致）；hint 文案仅「驳回可修改」
60. **审批表头与重提对齐（增量 ac）：** `AddDropApprovalModal` 行表 `th` MUST NOT `text-overflow: ellipsis`；短列（序号/学分/申请类型/课程类型/名额）用 `min-width`/`ch` 兜住完整表头，必要时 `overflow-x: auto`。`AddDropResubmitModal` 加宽至约审批宽、列序对齐审批（类型→学分→…→名额→决策/意见→操作）；有 `lineComment` 提供只读「意见详情」查看层
61. **因修未修固定 + 学生去名额（增量 ad，ah 修订）：** 初版 tip 与矩阵未修行同冻；**增量 ah 起**仅 tip 用基线固定快照；矩阵「未修/因修」跟 live strip。硬拦仍可用「含拟退不含拟加」的 catchUp。`AddDropResubmitModal` 去掉可选名额列（学生不需要）
62. **重提换课单选与规则（增量 ae）：** `resubmitPicking` 时选课器 `multiple=false`；`courseOptions`/`termCreditGate`/`pendingDropCodes` 由重提 `workingItems`+行 `action` 驱动，不写主表单 need*；重修带申请 `retakeType`+原课 `retakeFocusOriginal`；换课后相对整单其它行做冲突/学分校验
63. **重提换课池与已同意禁选（增量 aj）：** 退课池=在读课表（减未审拟退）；加课池=可加资格池；重修池=挂科/提分重修池（可带原课焦点）。三类 MUST 各用各池，MUST NOT 互相搬用。本单其它行 `lineDecision` 为 `approved`/`rejected` 占用的课号/课 id，在选课器 MUST 置灰不可选并提示；正在修改的驳回行原课保持可选。
64. **重提决策胶囊与同类型占用（增量 ak）：** 重新提交弹窗行决策列 MUST 使用与详情同源的彩色胶囊（通过绿/不通过红/驳回橙）。占用禁选 MUST 仅匹配**同 `action`** 的已通过/不通过行，MUST NOT 用退课已同意去灰加课/重修池候选。重修驳回换课打开选课器时 MUST 可浏览同重修类型下其它仍可选课（原课仅预勾选参考，MUST NOT 再用原课焦点过滤掉其它可重修课）；冲突/及格/学分等原有门控仍生效。
63. **预览底栏提示与虚线色（增量 ag）：** 申请「课程预览」抽屉 footer 左侧展示免责文案（右仍关闭）；覆盖增量 x 虚线色——加课 `#16a34a`（绿）、重修 `#ea580c`（橙）；课块与图例 swatch 同步；header/内容区仍无浅蓝 tip
64. **矩阵未修 live / tip 固定（增量 ah）：** `AddDropTermCreditStrip`：`termCatchUpCredits` 仅驱动蓝底 tip；矩阵未修= `resolveAddDropSituationCreditGaps(strip)`，因修右项= live 学期已选；拟加/拟退/重修均计入 strip 投影
65. **预览底栏 tip 样式（增量 ai）：** 申请课程预览 footer 左侧改为 tip 条：蓝底/蓝边、「提示」徽章、文案 `font-weight: 600`；样式对齐 `schedule-untimed-tip`；文案内容不变
66. **重修汇总灰字移除：** 申请重修区不再展示 `retakeCourseHint`（汇总必修/公选…合计）
67. **详情任课教师列：** 详情退/加/重修表教师列加宽左移，减少 ellipsis，尽量全文
68. **二次申请红字合并：** 蓝底不再展示 `pendingEstimateTip`；红字改为合并文案（估算+待审不可再交），前缀感叹号；替换原 `secondApplicationBlocked` 短句
69. **重修修读方式列：** 申请表重修汇总「修读方式」MUST 全文展示（同课号重修/同课程组重修），禁 ellipsis；可调列宽/字号
70. **已驳回禁二次发起：** 存在学生真实提交且展示为「已驳回」的申请时，MUST 禁止「发起申请」（与待审门控同类提示）；仍允许「重新提交」
71. **详情行决策胶囊：** 学生/老师详情操作列通过/不通过/驳回用彩色胶囊，与列表语义一致
72. **退课摘要跟表（增量 al）：** 「退课前」=可退池 Σcredits（弹窗=`props.courses`，表单=`dropPoolCreditsTotal`）；全选 N 门时退课前=退课合计=表内学分列之和；与上方学分条学期已选可数值不同，摘要不混用条基线
73. **重修 radio + 我的课表实态（增量 am）：** 重修选课器强制单选 UI；列表「我的课表」=`listMyResultCourses` 实态，MUST NOT 扣表单/未审拟退。课表生效仍走 `isAddDropScheduleEffective`（待缴不落课；缴费或无应付审结后落课）。申请内「课程预览」继续本单投影
74. **重修 radio 对齐（增量 ao）：** `.col-check` 内 radio/checkbox 垂直水平居中；radio MUST `@click.stop`（与 checkbox 一致），防止 tr 二次 pickRow 把选中立刻取消
75. **重提预览与取消行（增量 at）：** `AddDropResubmitModal` 底栏左侧「课程预览」，投影=`buildAddDropApplicationSchedulePreview(workingItems 按 Drop/Add/Retake)`，基线 `listMyResultCourses`；驳回行操作列「修改|取消」，取消=从 workingItems 删行；MUST NOT 增行；提交时 `approved`/`rejected` 保留决策与意见，其余（原驳回）→`pending`；无驳回行仅剩锁定行亦可交 Pending；审批弹窗对打开时已是通过/不通过的行锁定 radio，老师再点确定才落终态
76. **取消申请确认 + 课表无冲突（增量 au）：** 驳回行按钮文案「取消申请」；点后 `ConfirmDialog` 确认再删行。demo 我的课表：挪开落课申请/确认池中互撞时段（如 ENGL201 避开 MATH101/COMP201），同步申请 items 与课库同 section；选课器故意冲突分组保留
77. **重提回显可改 + 预览过滤 + 曾修列（增量 av）：** 重提交时保留通过/不通过决策与全部行意见（含原驳回）；原驳回→`pending` 但意见不清空。审批弹窗「全部可改」已被增量 ay 修订为锁定通过/不通过。重提预览：Add/Retake 仅已通过或已换课的驳回行；Drop 同理；未改驳回不投影。详情 `曾修课程成绩` nowrap+ellipsis+title
78. **课表默认无冲突 + 去副标题（增量 aw，方案 B）：** 不清掉落课课号；把互撞申请/课库时段挪到空档（如 ENGL201→Thu14–16、MATH201 重修→Mon10–12），并 reseed 清掉旧 Fri14 双课。`StudentAddDropView`「我的课表」抽屉不再传 `schedulePreviewAddDropHint` 作 subtitle；选课器故意冲突分组保留
79. **全量再扫落课 + FinalHint（增量 ax）：** 含 PartiallyApproved 通过行；STAT201 落课避开 CYS201 Mon14（改 Fri10–12 等空档）并 reseed。`StudentMyResultView` 不再传 `schedulePreviewFinalHintAll`；凡标题为「我的课表预览」的抽屉学号下均无长说明
80. **重提锁 Tab + 确认提交 + 账单生成时间（增量 ay）：** 加课重提 `lockedCourseTypeTab` 按驳回行课性（core/ge/me）藏其它 Tab（同重修模式）。`AddDropResubmitModal`「确认重新提交」先 `ConfirmDialog`。缴费 `groupPaymentLinesByBill` / 待收费卡片展示 `billGeneratedAt`（生成时间）；demo 与 live reconcile 写入该字段；审结有应付时继续 `mergeLiveUnpaidFromApproval`
81. **退课换课池 + 换课即 pending（增量 az）：** 退课重提 MUST NOT 用「本单已通过退课」做 `resubmitSiblingLocked` 置灰（方案 A）；确认时仍拦同课号重复。换课确认成功后该行 `lineDecision=pending` 并 `resubmitLineModified`。选课器超额 `ConfirmDialog` z-index ≥ 选课器+1（如 1400）
82. **退课同课号置灰 + 换后可再改 + 重修可换选（增量 ba）：** 退课占用锁恢复为「本单其它工作行同课号置灰」（对齐确认校验口径），MUST NOT 空集导致先选后报错。换课后行胶囊文案「待审批」（`pending`）；`isAddDropLineEditableForResubmit` 对 `pending`+`resubmitLineModified`（或重提窗内 pending）仍可修改/取消。重修选课器单选：已预勾/已选一门时其它行 MUST NOT `isRowDisabledBySibling` 禁选，允许 radio 点换
83. **加课同课号置灰 + 重提门控 + 缴费生成时间（增量 bb）：** 加课占用锁同退课——其它任意工作行同课号置灰。加课/退课重提单选允许再点已选项取消勾选。`确认重新提交` 仅当工作行无 `update_required`。缴费 seed/hydrate/分组账单 MUST 补齐并展示 `billGeneratedAt`
84. **去门控红字 + 课性锁修复 + ME 限制同源（增量 bc）：** 重提底栏去掉 `resubmitNeedHandleRejects` 红字（置灰/`title` 可留可去，默认去文案）。`resolveLockedCourseTypeTab` 优先统一课性，必修（含 `MANDATORY`）MUST 先于 ME 前缀判断。Tab 过滤与正式加课同源规则保持
85. **重提学分钉 + 虚拟课程组列（增量 bd）：** `AddDropResubmitModal` 学分条结构对齐审批 `approval-credit-strip--pin`。选课器课程组单元格：`isVirtualRetakeSelectionGroup` →「—」
86. **整单附件材料节（增量 be）：** `buildAddDropSectionBars` 增加 `attachments`（声明前）。表单从退课区移出上传控件到该节；详情去掉退课内附件与声明后独立块，改为声明前「附件材料」始终展示
87. **重提附件 / 已取消 / 锁类别过滤（增量 bf）：** `AddDropResubmitModal` 课程表下附件可调，提交写回 `attachments`。`confirmCancelLine` → `lineDecision=cancelled` 保留行；`isAddDropLineEditableForResubmit` 含 cancelled；换课 → pending。提交过滤 cancelled。选课器 `filteredRows`：有 `lockedCourseTypeTab` 时按课性过滤，与是否展示 Tab 解耦
88. **附件标题 / 待审批 / 缴费口径（增量 bg）：** 审批与重提附件节标题用 `sectionLabelAttachments` 纯文案。详情 `linePending` 改「待审批」或改用 `listStatus.Pending`。缴费：已缴分组优先 `orderNo`；卡片「合计费用」与行金额同用课程费 `feeTotal`/`feeAmount`（SST 仅结算区）；live 待缴行按 id 去重
89. **附件按钮居中 + 重修课程组范围（增量 bh）：** 重提 `attach-btn` justify/align center。`filterRetakePickerCoursesBySelectionGroupScope`：按原课真实组 / GE 虚拟 / ME 普通虚拟收窄重提与首次有焦点池；加课重提同类范围可复用
90. **组已选红字 + 附件对齐 + 同组收紧 + 有效拟退冲突（增量 bi）：** `seatStatusClass` 对 `groupMemberAlreadyTaken`/`课程组内已选` 用 `conflict` 红。重提附件按钮样式对齐申请表（高度/内边距/居中/`未选择文件`）。`resolveRetakeSelectionGroupScope` 补齐课性与 `selectionGroupId`；普通 ME 仅普通池，真实组仅同组。`countsTowardResubmitScheduleEffect`：仅有效退课进 `pendingDropCodes`/换课冲突基线；`validateResubmitReplacementLine` 与确认重提整单用同源有效行；申请类型行用 `type-add`/`type-drop`/`type-retake` 胶囊
91. **文案/附件/必修重修池/可取消（增量 bj）：** `pickerStatusGroupAlreadyTaken`→组内已选满语义。`lineUpdateRequired`→「已驳回」。重提 `attach-btn--soft` 提高优先级对齐申请表。单选：已勾选行可再点清空（`disabled` 仅未勾选冲突行）。重提必修：`filterRetakePickerCoursesByOriginal` 仍生效
92. **横线 + 组内文案 + 学分决策投影（增量 bk）：** 选课器表 `border-bottom` 加深，组色底仍可见横线。`groupMemberAlreadyTaken` 与 `meGroupPickCapReached` 分文案。`ensureApplicationDetailCredits`：Rejected 未落课走 `buildApprovalDecisionTermCreditStrip`（与重提同源），勿纯 live。重提选课 `activeTermCreditGate` / baseline 用有效工作行 + 申请基线，与重提弹窗跟手
93. **重提选课体验（增量 bl）：** 重提退课隐藏 selection-meta 红字。`creditStripAnchor`：勾选未变时展示重提外层 strip；变则差量投影。`validateConfirm` 失败写选课器内错误
94. **置灰硬禁（增量 bp）：** 收窄 bl：单选禁用行默认不可新选；仅 `preselectedLines` 匹配行可取消后再勾回；其它合法未禁用行可选；状态列先提示
95. **退课池对齐学分条（增量 bq）：** 演示基线可退池=必修+确认半池共 26 分。历史已缴/无账审结若含额外加/重修，seed 标 `scheduleApplied: false`，且 `isAddDropScheduleEffective` 遇显式 false 不得落课，避免红字「退课前」与条 26 分叉
96. **重提可留驳回 + 第三轮 tip（增量 br）：** `canConfirmResubmit` 仅要求至少一条非 `cancelled`，允许留下 `update_required`。`resubmitStudentAddDropApplication` 对 `update_required` 原样写回（`pending` 仍待审；通过/不通过不变）。老师 `initLineDecisions` 在 Resubmitted 后再审时锁定 `approved`/`rejected`/`update_required`。蓝 tip 第三行读 `getEffectiveAudienceRounds(...).supplement` 起止（≠ `addDropWindow`）
