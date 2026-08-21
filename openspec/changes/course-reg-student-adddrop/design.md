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
