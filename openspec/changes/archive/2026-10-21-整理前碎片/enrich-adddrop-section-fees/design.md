## Context

基线：`enrich-adddrop-form-sections` 已提供 I–V 分节表单与声明。当前选课仍以课程 id 确认，并用 `getCourseWithFirstOpenSection` 自动填组；时间/地点/教师合并展示；冲突仅审批端校验；费用为固定数字；加课池偏宽；主表列不足且无冻列横滑。

约束：Vue 3 原型 + mock；复用课表冲突检测与志愿表 sticky 模式；不接真实财务/成绩库。

## Goals / Non-Goals

**Goals:**

- 课→组两步选择；冲突组禁用并说明原因。
- 时/地/师分字段；费用按科类学分单价试算并展示。
- 加课资格与学期过滤；重修成绩单驱动。
- 主列表字段同步 + 冻列横滑。
- 学生端四类型 Tab 分列、表头不换行、新建锁定类型。

**Non-Goals:**

- 真实账单出账与支付。
- 冲突后默认强制展开退课节（改为禁用冲突组）。
- 替换已有分节/声明骨架。

## Decisions

### 1. 两步选择器

```
课程表（按资格过滤）→ 确认课
     → 分组表（该课 sections）
          可选 / 冲突禁用+原因 / 满员禁用
     → 回填 sectionCode, time, room, lecturer
```

- **选择**：扩展 `AddDropCoursePickerModal` 为两阶段，或「课程确认后内嵌分组面板」。
- **否决**：继续自动第一组。

### 2. 冲突策略

- 比对基准：学生当前课表（必修+已确认+表单内已选加/重修组，扣除拟退）。
- 冲突组：`disabled` + 文案如「与 COMP101（周一 10:00–12:00）冲突」。
- 换课路径：用户先 Drop / AddDrop 退掉冲突课后再选。

### 3. 加课资格 demo

| 标记 | 含义 | 可选 |
|------|------|------|
| `prior_drop` | 曾退课 | ✓（本学期开课） |
| `deferment_gap` | 休学落下 | ✓ |
| `future_session` | 后续学期 | ✗（不进列表） |
| 其它常规选修 | — | ✗ |

Notes 写明规则。实现：`addDropEligibleCourses.js`（或等价）按学生 id 返回池。

### 4. 重修 + 成绩单

- demo `studentTranscript.js`：课号、课名、成绩、学期、科类。
- 选成绩行 → 回填曾修信息；`F` 默认挂科重修，及格默认刷分（可改）。
- 再选**本学期**同课号分组。

### 5. 费用（§19：文商理类别超额）

```
rates = { arts: 500, science: 550, business: 600 }
fee = billableCredits × rates[course.feeStream]

重修：billableCredits = 课程学分
GE/ME 加课超额：
  categoryKey = 校选类别 → humanities|business|science（arts≡humanities）
  remaining = 本学期该类型（GE 或 ME）下文商理类别「要求 − 已选」
  billableCredits = max(0, credits − remaining)
  ※ 不以 GE/ME 总量剩余、不以学期总负荷 creditMax 计超额
计划内补 Drop/休学落下：仍可按上式计类别超额（资格不豁免类别超额）
```

表单声明前展示明细行 + 合计；写入 `feeEstimate` / `billAmount` / `excessCredits`（与 billableCredits 同源）。

### 5b. 审批超分不拦截（§19）

加课申请允许超分缴费场景。审批通过 MUST NOT 因 `creditsAfter > creditMax`（或类别超额）拒绝；审批人核对超出学分与费用后可同意。选课弹窗/表单仅提示，不硬拦选择与提交。

### 5c. 生成账单 ↔ 缴费名单（§20）

审批「通过」且申请有应收费用时，勾选「生成账单」将：`billStatus=pending`，并 `appendFeeRosterFromApproval` 写入**缴费名单管理**未缴费行（原型演示）。说明文案 MUST 写明该联动；MUST NOT 仅用「财务只读」外部数据 tip 代替业务说明。批量失败提示 MUST NOT 再举例「学分超限」。

### 5d. 退课校选类别与分组只读（§21）

- 已选课 `getStudentEnrolledCourses` / 退课候选 MUST 带出 `type` 与 `schoolElectiveCategory`（缺省走 `resolveSchoolElectiveCategory`），与我的选课历史一致。
- 退课分节「课程分组」MUST 为只读展示（选课后带出），MUST NOT 再提供分组下拉。
- 学生加退课列表 toolbar：成功/提示文案与「发起申请」同一行右对齐。

### 6. 表单字段拆分

替换合并的 `dayTimeVenue` 为 `classTime`、`venue`、`lecturers` 三只读字段。

### 7. 主列表

学生端与审批端：

- 增列：分组、上课时间、地点、教师、预估费用、重修类型（有则显示）。
- 容器 `overflow-x: auto`；冻左：序号、申请单号、类型；冻右：状态、操作。
- 参考 `StudentRegistrationCartDrawer` sticky 模式。

### 8. 学生端类型 Tab + 分列（增量）

对齐 `StudentMovementApplicationView` 的四 Tab 交互，但**同页轻量实现**（不必拆四个子 View）：

```
[加课] [退课] [重修] [加退关联]
        │
        ▼
  仅展示 type === activeTab 的申请
  列集 = 该类型专属列（表头 white-space: nowrap）
  发起申请 → form.action = activeTab（表单类型只读）
```

| Tab | 课程列 | 组/时/地/师 | 费用相关 | 去掉 |
|-----|--------|-------------|---------|------|
| Add | 添加课程 | ✓ | 预估费用 | 类型列、退/重修课名、重修类型、退费 |
| Drop | 退课课程 | ✓ | 退费抵免 | 类型列、加/重修课名、预估费用、重修类型 |
| Retake | 重修课程 | ✓ | 预估费用 + 重修类型 | 类型列、加/退课名、退费 |
| AddDrop | 退课 + 添加 | ✓（优先展示加课侧，缺省回落退课侧） | 预估费用 + 退费抵免 | 类型列、重修课名/类型 |

- 搜索区去掉「申请类型」筛选项（由 Tab 承担）。
- 白名单 `allowedActions` 不含当前 Tab 时：禁用「发起申请」并提示。
- 审批端不引入类型 Tab（保留状态 Tab）；本增量不强制改审批列集。

### 9. 起止周列 + 排课 demo 填充（增量）

- 各类型主表在「教学分组」后增加 **起止周**（`weekRange`，如 `1-18`）。
- demo 样本对齐排课图示：教师（Dr. Sarah / Dr. Brown / Ms. Chan / Dr. Ng / Ms. Tay）、地点（A2-*-*）、上课时间用 `deriveClassTime` 生成节次文案。
- 种子与审批初始队列经 `enrichAddDropApplicationSchedule` 补齐顶层与 `items` 字段；缺字段触发学生 demo 重种。
- 列表读取优先顶层字段，回落 item；展示层对 `time` 走 `deriveClassTime`，避免英文时钟裸露或空「—」。

### 10. Notes 按类型删减 + 状态胶囊 + 审批列同步（增量）

**Notes：** 按 `form.action` 只展示本类型实用规则（每节一门课、及适用的资格/冲突/先退后加）；有序列表编号；不展示分节填写指引与费用长文。

**状态胶囊：** 对齐学籍 `status-badge`；映射 Pending / In Review / Approved / Rejected / Cancelled。学生端与审批端列表均使用胶囊。

**Demo：** 五状态各 ≥2 条；四类型均有行；切换类型 Tab 或审批类型筛时可见明显差异。

**审批列：** 保留待我/已提交/历史 Tab；列固定含状态、申请类型、学号、姓名；课程/排课/费用列随类型筛（空=宽列含三科名；选中=与学生该类型列集对齐）。

### 11. 表单学分与说明收口（增量）

- Section II：「加课类型」下拉改为只读「学分」，来自所选课程；校验不再要求 `addType`。
- Notes：仅保留实用规则并顺序编号（见 §10 更新）。
- 去掉声明前零费用灰字；有费用时仍展示试算框。
- Section V：标准声明前增加分类型「其他申请说明」文案。

### 12. 操作列与表单字号（增量）

- 学生主表：`sticky-actions` 加宽至约 140px，`actions-cell` 禁止换行，保证「详情」「取消」横排；同步调整状态列 `right`。
- 字号层级（四类型共用 FormSections）：section-bar 15–16px > 正文 14px ≥ 标签/Notes/提示 12–13px；详情抽屉 section-bar 对齐。

### 影响文件（预期）

- `AddDropCoursePickerModal.vue`、`AddDropApplicationFormSections.vue`、`StudentAddDropView.vue`
- `AddDropApprovalView.vue`（列表列与状态胶囊）
- `AddDropApplicationDetailBody.vue`
- `addDropFormSections.js`、`addDropListColumns.js`、`addDropScheduleDemo.js`；`addDropStatusBadge.js`
- `studentDemoSeed.js`、`addDropApprovalQueue.js`
- `zh.js` / `en.js`；`movement-status-badge.css`（或等价）

## Risks / Trade-offs

- **[选择器变复杂]** → 两阶段同弹窗，步骤指示清晰。
- **[冲突算法与中文课表格式不一致]** → 统一用已有 schedule slot 结构比对。
- **[旧申请无新字段]** → 列表/详情缺省「—」。
- **[商/文/理映射不准]** → demo 课程显式挂 `feeStream`。

## 增量 §22

- 弹窗学分展示：`clampCreditBar` + 监控行类别快照；胶囊 tone 与 R1 一致（无 `is-over`）。
- 加课资格课时段：约半数组挪到确认课表空档（Wed/Thu/Fri 空档），保留若干冲突组。

## 增量 §25

- 资格课（COMP201/STAT201/HUM110/SCI110/FIN110）每个教学组显式 `meetings: [{ time }]`，避免 `synthesizeDemoMeetings` 追加段导致冲突面失控。
- 演示确认课压缩至学期帽内（约 17/20），使 3 学分「空档」行可选；COMP201（4 学分）保留一无冲突组演示「超出学期学分」。
- 11 行矩阵：5 可选（有余量）+ 6 不可选（时间冲突 / 已满 / 超出学期学分 均至少 1 行）。

## 增量 §26

- 表单加/退/重修清单：`displayClassTimeVenueLines` 分行渲染；单元格 `vertical-align: middle`；时间列去掉 nowrap。
- 选课弹窗：`attachCourseLevelRowSpans` 合并序号/代码/名称/学分/校选/类型；时间一行一段且允许换行；对齐在线选课 rowspan 居中。
- `projectAddDropCreditGroups`：baseline − 拟退 + 弹窗勾选拟加；弹窗内 `creditDisplayGroups` 用投影结果。

## 增量 §27

- 展示：`displayPrimaryType` / 列表已有映射；详情基本信息类型改为主类型三选一文案。
- `getAddDropApprovalListColumns`：去掉 APPROVAL_WIDE_MIDDLE 课程列。
- `AddDropApplicationDetailBody`：删除 items 清单表；按 action 分组渲染 SECTION 内多课卡片；卡片内行决策；页脚整单审批不变。

## 增量 §28

- 申请表单：`lines-table` 三节统一。
- 详情：SECTION 内 `items` 表格化；原因/附件在表后；详情只读；附件空显示「无」。
- 审批弹窗：传入单条 `application` 时展示汇总表 + 操作列（文案「操作」）+ 一键同意/不同意全部；确认时带回 `lineDecisions`。
- i18n：`lineDecision` →「操作」/ Operation。

## 增量 §29

- 清单表 `td` / 时间列：`white-space: nowrap`；去掉 `word-break: break-word`。
- 表 `min-width` + wrap `overflow-x: auto` 横滑。
- 多时段仍用多个 `.cr-time-venue-line`，每段自身不折。

## 增量 §30

- `AddDropApprovalModal`：行勾选 + 表头全选；一键仅改勾选行；标题「申请课程汇总」，下一行左对齐「批量同意 / 批量不同意」；去掉提交前引导句。
- 汇总列增：起止周 / 上课时间地点 / 任课教师；时间用 `displayClassTimeVenueFromFields`。

## 增量 §31

- 汇总表：去掉强制 `min-width` 横滑；`table-layout: fixed` + nowrap + ellipsis；字号约 12px、紧 padding；弹窗加宽。
- 标题：`section-bar`；批量按钮独立 toolbar 行，outline 小按钮。

## 增量 §32

- 学期帽按 session 月码：`09`→`LONG_SEMESTER_CREDIT_MAX`(20)；`02`/`04`→`SHORT_SEMESTER_CREDIT_MAX`(7，待补常量)。
- 加退 demo / 选课弹窗「约 17/20」类场景明确为**长学期例子**；若演示短学期须改已选与帽为 7 档。

## 增量 §33

- 申请弹窗顶部学分条：`current` / `afterDrop` / `afterNet`；传入 `currentCredits`、`creditMax`；与费用「超出学分」分离。

## 增量 §34

- `RETAKE_TYPE_OPTIONS` 去掉 `other`；类型控件移到重修节顶部；未选禁用选课。
- 选课池按课**最新一条**成绩：`F`/`M`→挂科；其余→提升。
- 已选表：挂科列「最近成绩」、提升列「原成绩」；切换类型清空 `addLines` 与曾修回填；`retakeHistoryFromCourse` 不再覆盖 `retakeType`。

## 增量 §35

- 色态：`is-short`=未满绿；`is-met`=刚好满橙；`is-over`=超额红（`current > max`）。
- 弹窗 `pickerCreditGroups` 顺序：`ge-grad` → `ge` → `me-grad` → `me`。
- 弹窗学分区字号约 13–14px、行宽吃满；`StudentRegisterView` 同源 CSS/tone 同步。

## 增量 §36

- GE / ME 各用 CSS Grid（总分 + 4 类共 5 列），毕业行与学期行上下列对齐、胶囊同高。
- `showCreditProgress` 含 `Retake`；投影仍为基线 − 拟退 + 勾选拟加/重修（§38 起含 Drop）。

## 增量 §37

- 重修：申请信息行「重修类型 | 是否需要退课」；SECTION 重修只保留选课表。
- 成绩单分池各 ≥3 `retakeCourseId`；每课 ≥2 分组有余量 + 错开确认课表 + 3 学分可过学期帽；可保留 1 冲突行对照。
- 加课 §25 COMP201 超帽/冲突 demo 不因重修池改坏。

## 增量 §38

- `showCreditProgress` 含 `Drop`；退课弹窗仍传 `termCreditGate`。
- 投影：`基线 − 拟退 + 拟加/重修`。退课弹窗：拟退=弹窗勾选（无勾选则用表单 dropLines），拟加=表单 addLines；加课/重修弹窗：拟退=表单 dropLines，拟加=弹窗勾选（无勾选则用表单 addLines）。
- 白名单新增：`SupplementEntryDrawer` 选人区改为 tag-field + chip（仅姓名）+ ×清除 +「选择/更换」，对齐 `BatchSpecialStudentAddModal`。

## 增量 §39

- 学期 GE/ME 分类已选一律由确认课（`sumLive*`）汇总；毕业行已选≡学期分类（要求用毕业配额）。
- `getTermGeCategoryBars` / `getTermGeElectiveCategoryBars` 走 `getStudentCreditLayers` 活数据，不再优先监控行写死 `termGeCategories`。
- 演示生种子：去掉 ME `7/5/3/3` 固定值，与 GE 一样按确认课写入监控行。

## 增量 §40

- 加退弹窗 `getStudentCreditLayers({ scope: 'confirmed' })`：只汇总确认课，不含篮/待分配。
- 去掉弹窗 `clampCreditBar`；已选保持真值，超额靠 §35 红态。
- `pickerCreditGroups` 各行 `total.current/max` = Σ 该行 categories。

## 增量 §41

- 加退表单选课「选择」：可操作时 `btn-primary`，禁用时保持灰。
- 在线选课 `termElectiveBars` / 入口卡 `creditBar`：current/max 取自 Σ 分类，不再单独用 type 汇总顶掉。
- `projectAddDropCreditGroups`：投影用完整课字段；结束后 `total.current = Σ categories.current`。

## 增量 §42

- 对标 `AddDropApprovalModal` 汇总表：`overflow-x: hidden`；去掉 `min-width: 720px`；`table-layout: fixed`；字号 12px；padding 约 5–6px。
- 短列（课号/分组/学分/周次/操作）定宽或百分比；课名与上课时间地点吃剩余宽度；单元格 nowrap + ellipsis + title。
- 触及：`AddDropApplicationFormSections`、`AddDropApplicationDetailBody`、`AddDropCoursePickerModal` 主表。
- §29「允许横滑」仅保留对学生/审批**主列表**等宽表；清单课表改走无横滑。

## 增量 §43

- 选课弹窗表头 checkbox：对齐审批汇总；全选范围 = `filteredRows` 中未禁用行；支持 indeterminate。
- 新增 `preselectedLines`（或等价）由父组件传入当前 `dropLines`/`addLines`；`visible` 打开时按 sectionId/courseId 匹配 `rowKey` 预勾。
- `StudentAddDropView` 确认：该侧清单改为 **replace**（`incoming` 直接写回），不再 `mergeLines` 并集。
- 页脚：`bypassCreditMax` + 净学分超学期帽 → 长文案（白名单内 / 允许超分提交 / 仍需审批）；与费用超额 hint 互斥优先级：白名单学期超分优先。
- 演示：主演示生白名单补 `bypassCreditMax`，便于加课超学期帽冒烟。

## 增量 §44

- 页脚触发改绑：`creditGroupsHaveTermCategoryOver(projected)` — GE/ME **本学期**行（`ge`/`me`）总分或任一类 `current > max` 且 `bypassCreditMax`。
- 表单超出学分：`computeTermCreditExcess(已选, dropLines, addLines, creditMax)`，不再用 `feeEstimate.billableCredits`。
- 退课分节增只读「退课总学分」；加课/重修分节标签改「加课总学分」「重修总学分」。

## 增量 §23

- 弹窗学分区：GE/ME 毕业与本学期各总分+四类（行序见 §35）。
- `buildAddDropPlanRemaining` 改为毕业类别剩余；`estimateCourseFee` 仅超毕业类别计费；ME 用课程组键。

## Migration Plan

纯前端；回滚还原本变更。localStorage 旧单只读降级。

## Open Questions

- GE 三桶（humanities/business/science）与收费三档（arts/business/science）映射：humanities→arts；business→business；science→science（已假定）。
- ME/专业课默认 `feeStream`：按开课学院 demo 标注，缺省 science。
