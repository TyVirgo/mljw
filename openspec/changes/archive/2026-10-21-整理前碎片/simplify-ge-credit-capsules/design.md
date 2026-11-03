## Context

- 入口卡（`StudentRegisterView.vue` `typeEntryCards`）的 GE 行数据链：
  - 学期行 `11/18`：`termCurrent`（分类已选求和）+ `termMax`（分类分母求和，兜底 `term.geMax`）；`term.geMax` 来自 `DEMO_TERM_CREDIT_CAPS.geMax = 18`（`studentAudience.js`）
  - 学期胶囊分母：`DEFAULT_TERM_GE_ELECTIVE_CATEGORIES.required { 5, 5, 4, 4 }`（`studentRegistrationContext.js`）
  - 毕业行 `11/48`：`graduationMax` = 毕业四类 `bar.max` 求和；`getGraduationGeBars` 把 `DEFAULT_GRADUATION_GE_PROGRESS.required { 12, 12, 12, 12 }` 覆盖到 `bar.max`
- 这些 `required` 同时被逻辑复用：`assertTermCreditCap`（提交拦截）、`wouldExceedTermGeCategory`（分类拦截）、`buildAddDropPlanRemaining`（费用按毕业类别剩余）
- 演示已选 GE 课在 `studentDemoSeed.js`（BUS301 商 2 分、BUS302 理 3 分、MPU402 文 3 分、BUS201 AI 3 分），另有购物篮/志愿池演示课可能贡献 GE 已选
- 决策前提（用户已确认）：展示与逻辑一起改；毕业胶囊保留分母但四类之和 < 18；演示已选不超过新上限（课程 1-3 分）

## Goals / Non-Goals

**Goals:**

- 学期 GE 行：整体帽 `x/6`，GE01-04 胶囊只显示已选、无分母
- 毕业 GE 行：总分 `x/18`（独立来源，不等于四类之和），胶囊保留分母 `{ 5, 5, 4, 2 }`
- 逻辑同口径：提交拦截按 6 分整体帽；去掉 01-04 分类帽拦截；费用计算按新毕业配额
- 演示数据自洽：已选 GE 合计 6 分，每门 1-3 分

**Non-Goals:**

- 不改 ME 侧任何数值与逻辑
- 不改 `COS2504015` 特殊演示生的帽配置
- 不改胶囊对齐样式（属 `align-ge-me-credit-capsules`）

## Decisions

1. **毕业总分独立来源**：`DEMO_PROGRAMME_CREDIT_TARGETS.geRequired` 12 → 18，入口卡 GE 毕业行 `graduationMax` 改用该值而非四类求和（ME 保持求和不变）。备选「在 `DEFAULT_GRADUATION_GE_PROGRESS` 加 total 字段」被否：培养方案目标本就是学分的权威口径，避免再造一个总数来源。
2. **分类帽停用方式**：`wouldExceedTermGeCategory` 直接返回 `false`（保留函数与调用点，避免牵连 ME 共用校验路径与错误文案），分类 `required` 数据字段保留（毕业胶囊仍需）。
3. **学期胶囊去分母**：在 `typeEntryCards` 为 GE 学期胶囊附加 `hideMax: true` 标记，模板按标记渲染 `GE01 3` 而非 `GE01 3/5`；不改动 `categoryBarsFromProgress` 数据结构（毕业胶囊与 ME 仍需 `max`）。
4. **学期行总分**：GE 行 `max` 直接取 `term.geMax`（6），不再用分类分母求和兜底前的 `termMax`。
5. **演示数据调整**（`studentDemoSeed.js`）：BUS302（理 3 分）移出 GE 确认课，BUS201（AI）3 → 1 分，MPU402（文）3 分、BUS301（商）2 分保持；目标 GE 已选 = 文 3 + 商 2 + 理 0 + AI 1 = 6。若购物篮/志愿池演示课仍贡献 GE 已选，一并移除或缩减，保证合计 ≤ 6。
6. **颜色语义反转（第二轮细化，用户 2026-09-30 确认）**：
   - GE 一律「达标语义」：`< 目标 → 橙`、`≥ 目标（含超出）→ 绿`。毕业分类目标=最低学分；毕业总分目标=18；学期总分目标=6。新增 `is-achieved`（绿）/ `is-pending`（橙）配色类，不复用含义相反的 `is-short`/`is-met`。
   - 学期 GE01-04 改为**灰色统计胶囊**（复用 `is-neutral` 配色），新文案「GE01已选：N学分」/「GE01 Selected: N credit(s)」（i18n `geDemand.termStatSelected`）。
   - 费用口径：GE 毕业免费额度 = 18 − 毕业已选**总分**（`remainingForTypeCategory` 对 GE 走总分 fallback，分类桶仅 ME 使用），超 18 才产生应收。
   - ME 侧分母与结构不变；配色与 GE 达标语义对齐：带「已选/要求」的胶囊未满橙、选满（含超出）绿（`creditCapsuleTone` → `is-pending` / `is-achieved`）；无要求灰色胶囊不变。
7. **展示文案与轮次口径（第三轮细化，用户 2026-09-30 确认）**：
   - **毕业分类胶囊文案**：`GE01 2/5` → `GE01(已选/要求) 2/5`（en: `GE01 (Selected/Required) 2/5`），入口卡/顶栏/弹窗/抽屉四处同步；ME 分类胶囊与学期灰色统计胶囊文案不变。
   - **入口卡/顶栏固定 R1 口径**：默认演示状态只选 1 门 GE 课（hum-demo-1，商，2 学分）→ 学期 `2/6`（橙，不满员）、毕业 `2/18`（橙）、分类仅 GE02 有 2 学分。解决「当前日期已过 R3，按累计口径默认视图又会 6/6 满员」的矛盾。
   - **轮次累计演示**：R1 = 1 门（hum-demo-1 商 2 分）；R2 = R1 + BUS301（商 2 分）= 4 分；R3 = R2 + MPU401（文 2 分，g3）= 6 分（≤ geMax）。管理端代选（BUS201）不计入本轮选课/学分累计。第十二轮起本轮表仅当轮所选，学分仍可累计。
   - **实现要点**：志愿池种子（`seedVolunteerSheetDemo`）GE 由 3 门改为 1 门；`listRoundStatusCreditCourses` 与 `myRegistrationList` 的 main/supplement 分支改为 GE 轮次累计口径（R1 待分配跨批纳入 + 更早轮 round 确认跨批纳入、排除 admin）；入口卡/顶栏学分统计沿用现有 `scope:'round'` 数据源（默认批 g1 → preselect → 仅 1 门），不随后续轮次累计增长。
8. **GE 选课限制双入口（第四轮，用户 2026-10-08 确认）**：
   - **在线选课**：`assertTermCreditCap`（学期 ≤6）+ 新增 `checkGraduationGeCapForCourse`（毕业 ≤18）硬拦；分类闸 `wouldExceedTermGeCategory` 保持恒 false。毕业已选口径与顶栏同源（`getGraduationGeBars` + `scope:'round'`）。
   - **加退课**：不调用毕业 18 硬拦；超 18 仅产生 `billableCredits` 缴费提醒。学期超限仍走既有 whitelist/bypass 提示。
   - **旧逻辑清理**：`creditBarIsOver` 对 `isStat`/`hideMax` 均跳过，避免 GE 学期灰色统计条或毕业分类超最低被误判为「超额」。
9. **ME 最低学分 + 门数上限（第五轮，用户 2026-10-08 确认）：**
   - **分母算法**：对批次 `selectionGroups` 各组，取组内课程学分升序前 `minPick` 之和作为该组最低学分；映射到 `group4of3/group3of2/group2of1`；`ordinary`（ME选课）= `max(0, totalCap - Σ组最低 - 1)` 留缓冲，保证 Σ四类 < 学期/毕业总分帽。
   - **展示**：学期/毕业分类均带分母 + 达标色（未满橙/达标绿），附 `statLabel` 渲染「4选3（已选/要求）」/「ME选课（已选/要求）」；毕业总分改用培养方案 `meRequired`。
   - **闸门**：去掉 ME 分类学分上限拦截；改为组内门数不得超过 `minPick`；学分只卡学期总分 `meMax`。
10. **ME R1 提交学分三卡（第六轮，用户 2026-10-08 确认）：**
    - 展示：仅 `batchType===ME` 且 `round===preselect`；顶栏 `cr-student-cart-toolbar` 中插在操作按钮与学分胶囊之间。
    - 数值：`termRequired=meMax`；`submitMax=2*meMax`（写死倍数）；`selected`= `listRoundStatusCreditCourses`（preselect）ME 学分和。
    - 闸门：`assertTermCreditCap` 在 ME+preselect 时 cap=`2*meMax`；R2/R3 仍 meMax。
11. **R1 四列表 + GE 双倍（第七轮，用户 2026-10-08 确认）：**
    - **仅 R1**：整块右对齐四列表——①学期要求 ②允许最大(2×) ③已选 ④原学分胶囊两行（毕业+学期）合并进第四列；表头浅蓝（深字）。
    - GE/ME 同版式；GE：`termRequired=geMax`，`submitMax=2*geMax`，`selected`=本轮待分配 GE 学分和。
    - 闸门：`assertTermCreditCap` 在 preselect 时 GE/ME 均 cap=`2*学期帽`；R2/R3 顶栏与硬拦保持原样（独立胶囊、原帽）。
    - 统计导出泛化为 `getR1CreditSubmitStats(batch)`（按批次类型取 ge/me）。
12. **列表搜索与第四列底色（第八轮，用户 2026-10-08 确认）：**
    - 搜索字段：`code`、`name`（拆自 keyword）、`schoolElectiveCategory`、`weekday`（Mon–Fri）、`availability`、`credits`、`prerequisites`；去掉 `type`（GE/ME）。
    - 校选：`getSelectableCoursesForStudent` 不再硬滤校选类别；`filterStudentCourseList` 按搜索值滤；进页/重置默认「全部」（空字符串）。
    - 上课时间：单选；课的 `time`/`meetings`/sections 任一时段 day 命中即保留。
    - 布局：常显 code/name/校选/上课时间；第二行 availability/credits/prerequisites + 收放（FeeRoster 同款）。
    - R1 `.cr-r1-credit-card--detail` / detail-matrix 背景改为白/透明，前三列仍浅蓝系。
13. **R1 五列重组（第九轮，用户 2026-10-08 确认）：**
    - 列：①学期已选/要求（`termElectiveBars`）② submitMax（`r1CreditStats`）③学期分类 2×2（`termCategoryBars`）④毕业已选/要求（`graduationElectiveBars`）⑤毕业分类 2×2（`graduationCategoryBars`）。
    - ③/⑤ 无浅蓝表头，白底行合并；①②④ 保留浅蓝表头+数值。
    - GE/ME 同 DOM；文案/胶囊格式随 `batchTypeTab` 与既有 bar 语义。
    - 超允许最大时在 ① 数值标红（对比 `r1CreditStats.selected > submitMax`）。
14. **预览搜索 + 一览序号（第十轮，用户 2026-10-08 确认）：**
    - `StudentPendingRoundPreviewPanel`：搜索字段与 R1 同构但去掉 `availability`；常显 code/name/校选/上课时间；第二行 credits/prerequisites + 收放；校选默认「全部」。
    - `StudentCourseCatalogDrawer`：表头/行首列加 `common.serialNo`，按排序后列表 1…n。
15. **GE R2/R3 累计对齐（第十一轮，用户 2026-10-08 确认）：**
    - `myRegistrationList` / `listRoundStatusCreditCourses`：GE 累计时确认课 **必须 type=GE**；`sourceType==='admin'` **同批也排除**。
    - 演示学分：R2=HUM201(2)+BUS301(2)=4；R3 曾为 +MPU402(3)=7，第十三轮改为 +MPU401(2)=6。不再串入 COMP101(ME) 或 BUS201(admin)。（第十二轮起本轮表门数与学分可分离。）
16. **本轮表 / 课表分层（第十二轮，用户 2026-10-08 确认）：**
    - `myRegistrationList`（R2/R3）：仅**当前批 + 当前轮**确认课（及本轮排队）；**不再**跨批拉 R1 pending。
    - Demo：HUM201、ME 中签（COMP201/AI110）写入 `studentConfirmedCourses`（`roundKey:preselect`）；R1 仍用 pending 展示待分配。
    - `listRoundStatusCreditCourses`（学分）：≤当前轮已确认（同类型、非 admin）+ 本轮 pending（仅 R1）；与表门数可分离。
    - 课表：虚线=`listRoundStatusCoursesForSchedule`≡本轮表；实线=确认课按批类型过滤 + 志愿中签补齐；去掉异类型杂课。
17. **R3≤学期帽 + R2/R3 四列顶栏（第十三轮，用户 2026-10-08 确认）：**
    - Demo：`DEMO_ROUND_CONFIRMED_COURSES` g3 课改为 `course-mpu-demo-1` / MPU401 / 2 学分 / `arts`（GE01）；累计 R3=6 ≤ geMax；reseed 认 MPU401、剔除旧 MPU402。
    - 顶栏：R1–R3 共用 `.cr-r1-credit-panel` 列式；仅 R1 显示「允许提交最大学分」列；R2/R3 为四列（学期总分 → 学期分类 → 毕业总分 → 毕业分类）；去掉独立胶囊矩阵；学期硬拦仍 geMax/meMax。
18. **ME 课表与 GE 虚实对齐（第十四轮，用户 2026-10-08 确认）：**
    - `buildPreviewSchedule` 实线层：确认课须 `scheduleRoundOrder(roundKey) < 当前轮`（严格更早）；同轮确认只经本轮表虚线展示。
    - Demo：R2=`CST201`（`batch-me-cst-i` / main）；R3=`CYS201`（`batch-me-cys-i` / supplement）；保留 R1 中签 COMP201+AI110（preselect / m1）；移除 COMP101（m1/main）与 IT102（m1/supplement）避免跨批同轮实线泄漏。

## Risks / Trade-offs

- [演示生其他视图（监控统计、费用演示、课表）依赖确认课集] → 移出 BUS302 只影响演示叙事，不改逻辑代码；实现后全页面人工过一遍
- [localStorage 里旧的演示快照（旧 required 值）优先于新默认值] → 演示数据有重置入口/重播种逻辑（`studentDemoSeed` 已有对齐检查），必要时提示用户清除站点缓存
- [费用从分类剩余改为总分剩余后，多课逐课扣减顺序影响明细分配] → `consumePlanRemaining` 对 GE 只维护总分；`geCategory` 桶保留但 GE 计费不再读取，行为可预期
