# 选课管理-学生在线选课 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-register-ge-stats-row

## Decisions

1. GE 统计移至管理端 `RegistrationResultView` 顶部（主内容区最上，视觉位于面包屑下）；学生端在线选课移除 GE。
2. 抽取可复用 `GeDemandStatsBar`（或等价 markup），数据仍来自 `getGeDemandStats()` / `DEMO_GE_DEMAND_STATS`。
3. 学生端学分规则 callout 独占顶栏；列表项横向一行（`flex` + wrap），窄屏可折行但不按两段纵向列表占高。
4. 管理端原 warning callout / Tab / 表顺序不变，GE 条在其上方。

## 来源：add-register-list-sections-column

## Context

列表列至课程名称后即类型；详情用 `CourseSectionCard` + `sectionNameDisplay`（分组名称{code}）。

## Decisions

1. 列位置：课程名称之后、课程类型之前  
2. 文案：表头「教学分组」；单元格 `(sections||[]).map(code → sectionNameDisplay).join(', ')`，空为 —  
3. 样式：允许换行，略限 `max-width`  

## Risks

- [Risk] 分组多时单元格过长 → Mitigation：换行 + max-width  

## Open Questions

（无）

## 来源：add-student-credit-progress-toolbar

## Context

工具条已有选课篮入口。`getStudentCreditSummary` 仅有学期总学分区间，无必修/选修拆分。

## Decisions

1. **口径 A（培养方案累计）**  
   展示毕业向：必修/选修「已修 / 要求」。  
   已修 = demo 历史累计 + 当前已确认课学分（按类型归桶）。

2. **类型映射**  
   `Mandatory` → 必修；`ME` / `GE` → 选修。

3. **布局**  
   ```
   [必修 x/y · 选修 a/b]     ……flex……     [选课篮按钮]
   ```
   未达标可用警示色（已修 < 要求）。

4. **Demo 常量**  
   要求与历史已修写在 `studentRegistrationContext`（或小模块），保证刷新后数字稳定可读。

## Risks

- [Risk] 与「本学期 12–20」混淆 → Mitigation：文案标明「必修/选修」，不写学期上下限

## Open Questions

（无）

## 来源：collapse-student-cart-to-toolbar

## Context

当前 `cr-student-register-layout` 为 `1fr + 280px`，选课篮 sticky 侧栏。

## Decisions

1. **主区单列满宽**：搜索 → 工具条 → 表格。
2. **工具条按钮**：`选课篮 (n) · x 学分`；预选用志愿文案。
3. **详情抽屉**：迁入原 aside 内容（列表/空态/提交/消息）；壳对齐模块抽屉。
4. **CSS**：移除双栏 grid；侧栏样式改为抽屉内复用 class。

## Risks

- [Risk] 加篮后侧栏不可见 → Mitigation：按钮数字实时更新，可考虑加篮后短提示（本轮不强制）

## Open Questions

（无）

## 来源：default-register-entry-and-queue-ux

## Context

- 冷启动 `currentPageId` 为 `cr-flow-guide`；从门户再进已是 `crs-register`。
- 选课页初始轮次跟 `getActiveRoundPhase()`，进行中批次为 `main`。
- `submitSingleCourseRegistration` 使用 `silent: true`，不弹队列。
- 成功页 `viewResult` → `crs-result`；本轮情况抽屉在 `StudentRegisterView` 本地 state。

## Decisions

1. 默认页：`App.vue` 初值改为 `crs-register`。
2. 默认轮次：选课页初始固定 `preselect`，不改 `getActiveRoundPhase` 语义。
3. 立即选课：`runRegistrationQueue` 改为非 silent，展示 waiting → success。
4. 成功按钮：store 增加「请求打开本轮选课情况」信号；选课页 watch 打开 cart drawer；确保导航在 `crs-register`；文案改为「本轮选课情况」。

## Risks

- 非选课页触发队列成功时需先切到 `crs-register` 再开抽屉。

## 来源：fix-register-list-ui-polish

## Decisions

1. 漏斗用 `creditsFilterOpen` 点击切换；选完选项后关闭；`table-wrap` 对本页 `overflow: visible`，面板 `z-index` 提高。
2. 已满：`showWaitlistAction` 恒 false；状态列与 tip 走「课程已满，暂不可选」。
3. 不可选 tip 向上展开 + 高 z-index，避免被底边裁切。
4. 列表不渲染 `tag-hot`。
5. 排队中勾选列：CSS spinner，不可勾选。

## 来源：flatten-register-table-by-section

## Context

主表一行一门课；`formatSectionNames` 合并分组；`handleQuickRegister` 打开 `StudentSectionPickerDrawer`。

## Decisions

1. `flattenCoursesToSectionRows(courses)`：无 sections 时仍出一行（分组字段 —，不可选课）。
2. **§8 修订**：分页按课程聚合（`paginateSectionRowsByCourse`）；`total` 为课程门数；同课分组不跨页；页内纵向滚动。课级列 rowspan 合并序号/代码/名称/类型/校选课类型/学分/先修（ME 含课程组）。
3. 名额列用 section `enrolled/capacity`；课级 `eligibility` / 先修 / 类型 / 学分每行复用。
4. `canRegisterRow`：课可选且分组未满且未占用。
5. 行内「立即选课」打开 `ConfirmDialog` 询问是否确认选择；确认后调用 `submitSingleCourseRegistration`；取消关闭弹框。去掉 picker。

## Risks

- 展开后行数变多，默认 20 行仍可接受。

## 来源：polish-my-courses-table

## Context

`unify-round-direct-register` 已落地单课确认进队与「我的选课」履历，但抽屉为卡片，且 `runRegistrationQueue` 默认立刻展示 overlay。

## Decisions

1. **表格列**：代码/名称、起止周/时间/地点分列，与排课字段一致。
2. **静默入队**：`runRegistrationQueue(..., { silent: true, showSuccess: false })`；`queueOverlayVisible` 控制展示；「查看进度」调用 `revealQueueOverlay`。
3. **提交不阻塞**：`submitSingleCourseRegistration` 校验通过后设置 pending 并启动静默队列，立即返回 `{ ok: true, queued: true }`。
4. **Demo**：种子 `pendingRegistration`（如 COMP220）+ `studentFailedRegistrations`（如 ENGL201）+ 既有成功半池。
5. **再选一次**：清除失败记录并打开该课 `StudentSectionPickerDrawer`。

## Risks

- 静默队列与「查看进度」展示态需共用同一 timer，避免重复启动。

## 来源：polish-register-capacity-column

## Context

分组展开后主表含「已选/容量」（仅字色区分）与「选课状态」标签列；操作列已有阻塞原因 tip。

## Decisions

1. 容量值用内联胶囊 `.capacity-pill`，样式对齐 `tag-green`/`tag-red`：`border-radius: 999px`、`padding: 2px 8px`、未满 `#d1fae5`/`#047857`、满员 `#fee2e2`/`#b91c1c`；无分组显示 `—`。
2. 表头「已选/容量」浅灰底 `#f1f5f9` 标识列。
3. 删除选课状态列及仅服务该列的 shortLabel / tagClass。

## Risks

- 无；操作列仍可表达不可选原因。

## 来源：polish-register-round-capacity-ux

## Context

学生列表 `seatStatusLabel` 使用 `remaining/total`；分组弹层使用 `enrolled/capacity`。轮次条用 `batch.round*` 文案，CSS 为 4 列 grid 但仅 3 卡。

## Decisions

1. **名额公式**：`(totalCapacity - remainingCapacity)/totalCapacity`，状态文案仍按余量判定有余量/已满。
2. **轮次命名**：改 `batch.roundPreselect/Main/Supplement` 与列表列头等同键，管理端批次一并统一为「第 N 轮选课」。
3. **间隔**：仅调整 `DEFAULT_ROUNDS`（及摘要字符串）使相邻轮次不首尾相接；不写死「结束+3」校验。
4. **箭头布局**：时间条改为 flex；三卡 `flex:1`，卡间插入不可点右箭头，整行占满。

## Risks

- 管理端旧文档/截图仍写 Pre/Main/Supp，以新文案为准。

## 来源：polish-section-credit-ux

## Context

承接我的选课表格化与队列 UX；规则文案已在 `registrationRules.items.CR003/CR004`。

## Decisions

1. **分组列表**：表格列：分组名称、已选/容量、任课教师、起止周、上课时间、上课地点；行点击选中，满员禁用。
2. **学分提示位置**：`StudentRegisterView` 内、`RoundTimelineBar` 之前；复用 `CourseRegistrationCallout`，保留下方轮次说明。
3. **参数来源**：`registrationRules` 中 CR003/CR004 的 params（缺省 12/20、21）。
4. **副标题**：展示已选学分 + 最低/上限含义 + 相对状态一句（差多少 / 已在范围内 / 超上限）。
5. **退课确认**：`window.confirm`，与取消排队一致。

## Risks

- 分组很多时表格横滑；抽屉宽度与我的选课对齐。

## 来源：polish-section-picker-credit-visual

## Decisions

1. 学分条：`regular · resumption` 合并为一行 `nowrap`，字号 14、字重 600。
2. 分组表：首列 radio；选中 `box-shadow` 左边条；表头 14px/700，数据 13px。
3. 有余量：容量列绿色；已满：行浅灰红底、容量列红色、禁用。
4. COMP3192：5 个分组，其中 1 个满员。

## 来源：polish-student-cart-section-style

## Context

选课前分组用 `CourseSectionCard`（`section-head` + `section-fields` 两列标签值）；选课篮仍是 head + 一行 `small` 拼接。

## Decisions

1. 选课篮条目复用同等信息结构与样式 token（border `#e5e7eb`、radius 8、字段 11px 灰标签 / 13px 值）  
2. 头行：左为「分组名称{code}」（与分组卡一致），右为「删除」；其下展示 `CODE · N cr` 与课程名  
3. 字段网格同分组卡：教师、起止周、上课时间、地点；时间/起止周保留 tip  
4. 候补：无分组明细时展示候补文案，不硬套空字段  

## Risks

- [Risk] 抽屉宽度 480 两列偏挤 → Mitigation：窄屏改单列（同分组卡 media）

## Open Questions

（无）

## 来源：polish-student-register-toolbar

## Context

选课篮 tip 曾靠右裁切；类型 label 带缩写前缀。学分区两列两行已落地，但产品决定工具栏不再展示培养方案学分进度。

## Decisions

1. **Tip**  
   选课篮左对齐后，hint 改为默认向右展开（去掉 `align-end`），避免贴左裁切；保留加宽 `max-width`。

2. **类型 label（全局）**  
   - zh：专业选修 / 公共选修 / 必修  
   - en：Major Elective / General Elective / Mandatory  

3. **去掉学分进度 UI**  
   从 `StudentRegisterView` 工具栏移除 `cr-student-credit-progress` 及相关本页 helpers；`getStudentCreditSummary` / programme demo 数据可保留供抽屉学期学分等使用。

4. **选课篮左对齐**  
   工具栏 `justify-content: flex-start`；去掉 actions 的 `margin-left: auto`。

## Risks

- [Risk] 全局改 label 影响批次列表 → 接受  
- [Risk] 后续若再要学分进度 → 可复用 context 中的 programme 计算

## Open Questions

（无）

## 来源：queue-result-overlay-gated

## Context

`finishQueueWithResult` 用 `(showSuccess || keepOverlayOpen)`，关 overlay 仍会因 `showSuccess` 弹成功页；失败时若 overlay 开着则直接 `resetQueue`，无失败 UI。

## Decisions

1. 结果页唯一门槛：`queueOverlayVisible === true`；否则 `resetQueue`。
2. `queuePhase` 增加 `failed`；课程卡复用 `successContext`（或同结构字段）。
3. 失败页文案独立 i18n；主按钮复用「本轮选课情况」→ `requestOpenRoundStatusDrawer`。

## Risks

- 关 overlay 后用户需自行打开本轮选课情况查看成败（符合预期）。

## 来源：refine-my-courses-queue-ux

## Context

承接 `polish-my-courses-table`：静默入队 + 表格履历已落地。

## Decisions

1. **关闭 vs 取消**：关闭只设 `queueOverlayVisible=false`；取消需 `window.confirm`（或等价确认）后调用中止，并将 pending 记入 `cancelled` 履历。
2. **取消选课**独立状态 `cancelled`，操作与 `failed` 同为「再选一次」。
3. **批量退课**仅作用于勾选的 `success` 且处于可退选阶段的行。
4. **冻结列**：左 sticky（勾选、序号、代码、名称）+ 右 sticky（状态、操作）；中间列 `white-space: nowrap`。

## Risks

- 双端 sticky 在窄屏需保证背景不透明，避免横滑透底。

## 来源：refine-queue-history-cart-ux

## Context

`waitSeconds` 递减到 0 后 silent 路径会 `resetQueue` 关弹层；cart 对 failed/cancelled 有 retry；结果页有退选列；菜单与工具栏文案偏「结果/我的选课」。

## Decisions

1. 对外展示 `elapsedSeconds` 递增；内部仍用 totalWait 决定何时出结果；结束后保持 overlay（success 或 waiting 完成态由现有 success 页 / 保持可见，silent 完成后若 overlay 打开则切 success 或至少不 reset 关窗——学生主动查看进度时按 showSuccess）。
2. 失败/取消操作列显示 —，移除 retry。
3. 结果页只读历史；去掉操作列与相关 callout。
4. `crsResult` → 选课历史；`cartToolbarButton` / `myCoursesTitle` → 本轮选课情况。

## Risks

- silent 完成后若仍打开 overlay，需展示 success 或完成提示，避免空白 waiting。

## 来源：remove-register-adddrop-timeline-card

## Context

轮次条第四卡仅为跳转加退课页的捷径；侧栏已有专用菜单。

## Decisions

1. `getRoundTimeline` 不再 push `addDrop` 步骤  
2. 清理 Register 页 `handleRoundChange` 中 addDrop 分支与时间条 navigate 样式  
3. 保留批次 `addDropWindow` 与学生加退课页  

## Risks

（低）习惯点第四卡的用户改走菜单  

## Open Questions

（无）

## 来源：split-student-register-by-course-type

## Context

学生在线选课拆成「轮次下拉 + 类型 Tab」。续修：下拉样式对齐、去掉轮次说明、修复 GE 可选、关闭轮次整页提示。

## Decisions

1. 布局：轮次下拉 → 类型 Tab（GE | ME）→ 搜索/表；无 roundPanel info callout。
2. 轮次下拉：复用搜索区 label+select 视觉；宽度按最长选项文案测量，必须NOT 被 180px 截断。
3. 类型 Tab 切换：`setActiveBatchTypePreference`；`getActiveBatch()` 按类型取 active。
4. GE demo 批次：scope 补齐各轮 `round`，intake 含演示学生 `2024/09`，保证一二轮可志愿/选课。
5. 轮次开放：`demoClosedRounds`（如 GE 的 `supplement`）；关闭时 warning callout「不在选课时间段内」，禁用提交；行内不为此共性原因展示 tooltip。
6. 行内 tooltip：仅个别资格（先修、已修、批次范围等）或满员等行级原因。
7. 保留搜索「课程类型」与表格列。

## Open Questions (resolved)

- 大类切换切换批次上下文 ✓
- 保留类型列/筛选 ✓
- 参考图：轮次下拉在上、类型 Tab 在下 ✓
- 去掉轮次说明；关闭轮次整页提示 ✓

## 来源：sync-register-search-with-table

## Context

主表已按分组展开并去掉选课状态列；查询仍筛 eligibility，availability 用课级 remainingCapacity。

## Decisions

1. 搜索表单去掉 `eligibility`；`filterStudentCourseList` 不再处理 eligibility（避免死代码路径被误用）。
2. availability 标签用 `courses.enrolled`（已选/容量）；**§8 修订**：`filterCoursesBySectionAvailability` 在课级判定，任一分组命中则保留该课全部分组行后再展平。
3. `filterStudentCourseList` 去掉 availability，避免课级与行级双重过滤。

## Risks

- 一门课多分组时，「有余量」展示该课全部分组行（任一分组有余量即保留整课）。

## 来源：unify-round-direct-register

## Context

原预选=志愿篮、正选=攒篮再提交，与产品定义冲突。产品：三轮真选课；对象/时间不同；同档 FCFS。

## Decisions

1. **统一提交**：`submitSingleCourseRegistration` → `runRegistrationQueue` → 成功写入 `studentConfirmedCourses`  
2. **弹层**：分组单选 + footer 确认/关闭  
3. **我的选课**：confirmed + pending + failed；成功调用既有 `unselectConfirmedCourse`  
4. **失败 demo**：队列完成时约 15% 记失败（不占容量）  
5. **候补**：满员仍可直接加入候补，不经草稿篮  

## Risks

- [Risk] 随机失败影响演示稳定性 → 可接受原型概率  
- [Risk] 旧 cart API 残留 → 保留函数但页面不再走攒篮主路径  

## Open Questions

（无）

## 增量：批次优先导航（2026-07）

## Decisions

1. **批次优先**：学生端顶区改为「选课批次」+「选课轮次」；批次选项仅 `status === 'active'`；默认第一条。
2. **选中驱动上下文**：`studentSelectedBatchId` → `getActiveBatch()`；同步 `activeBatchTypePreference` 为批次 `type`。
3. **类型 Tab**：批次已绑定类型后 **不再展示** 公共选修/专业选修 Tab；课表仍按 `batch.type` 过滤（ME 含校选类别列）。
4. **轮次过滤**：仅 `start`/`end` 均非空的轮次进入下拉；默认轮次取 `demoActiveRound`（若已配置），否则取第一个已配置轮次。
5. **已过/关闭**：继续用 `demoClosedRounds`；关闭时仅禁「立即选课」（既有 `canRegisterRow` / `isRoundRegistrationOpen`）。
6. **Callout**：学分规则条从页顶挪到批次/轮次区与主表之间。
7. **GE demo**：命名 `General Elective Selection (…) for HUM|BUS|MPU …`；三 active 批各挂不同课；轮次 demo 状态错开。
8. **操作列**：去掉详情；`!isRoundRegistrationOpen` 时整列隐藏；窗口内每行恒显提交按钮，不可提交则置灰 + 左侧 `!` tip（含 `isCourseOccupied`）；无 tip 时左侧槽位留空对齐。
9. **窗外本轮选课情况**：过滤 `queued`；保留 `pendingAssign` 等只读；抽屉不展示操作列；无操作列时状态列 `right: 0`。
10. **第一轮容量列**：表头「志愿数量/课程容量」；分子为分组志愿数；色阶：`<cap` 绿、`cap～2cap` 黄、`>2cap` 红；`submitStudentPreselectVolunteer` 不再因满员拒绝学生提交。
