# 设计：student-selection-group-display

## Context

- 主表 `StudentRegisterView` 将课程按 `section` 展平为 `sectionRows`，列含课程代码、名称、**课程分组**（教学分组）、类型等。
- 「课程分组」≠ 跨课程选课组；后者目前无数据模型。
- 需求：主表体现「哪些课属于一组、至少选几门」；本期仅展示，不校验。

## Goals / Non-Goals

**Goals:**

- A：新增「课程组」列（组名；**仅 ME 批次**）
- C：同组行浅蓝/浅黄交替底色；无组无样式（**仅 ME**）
- Demo：**ME** 三档批（m1/cst/cys）各 3 组、`minPick: 1`
- GE 批次为普通选课，**不**挂 `selectionGroups`、**不**展示课程组 UI

**Non-Goals:**

- GE 批次课程组展示

- 提交校验、进度面板、管理端配置、方案 B 组头行

## Decisions

1. **数据挂在批次 `selectionGroups[]`**
   - 字段：`id`, `name`, `nameEn?`, `courseCodes[]`, `minPick`
   - 备选曾考虑挂在每门课 `selectionGroupId`；批次侧集中配置更贴近「开课设计」来源。

2. **解析模块 `courseSelectionGroups.js`**
   - `getSelectionGroupsForBatch(batch)` / `resolveSelectionGroup(course, groups)`
   - `sortSectionRowsBySelectionGroup(rows, groups)`：有组按 `groupId` 聚块 → 组内按课号 → 无组保持相对顺序并排在各组之后（或夹在未分组原序中：实现取「组块优先相邻，无组跟在全部组块后」以简化色条连续）

3. **UI 列位置**
   - 「课程名称」→「课程分组」→「课程组」；列名「课程组」/ `Selection group`
   - 每行重复完整文案（分页后单行可读）；无组 `—`
   - hint-popover 说明与教学分组无关

4. **行样式（C）**
   - 同组行底色交替：**浅蓝 `#dbeafe` / 浅黄 `#fef9c3`**
   - **无左边色条**；无组无底色

5. **Demo 矩阵（增量）**
   - 命名统一：`课程组名称01` / `Course Group Name 01`
   - **ME** 三档批各 **3 组、2 选 1**（`minPick: 1`，2 门）；成员课教学分组 ≤2
   - **GE 批次不配置** `selectionGroups`
   - 辅助：`buildDemoSelectionGroups(batchKey, chunks)`

7. **ME/GE 分流（增量 §7）**
   - `StudentRegisterView`：`batchTypeTab === 'ME'` 时才解析组、展示列、应用底色与聚块排序
   - GE 列表与改前普通选课一致（白底、无课程组列）
   - 单元格 **仅显示组名**（不展示「至少 M / 共 N 门」）

6. **列顺序（增量）**
   - 「课程名称」→「课程分组」→「课程组」→ …

8. **课级合并与按课程分页（§8）**
   - 模块 `sectionTableRowSpans.js`：`buildSectionRowsFromCourses`、`filterCoursesBySectionAvailability`（课级）、`paginateSectionRowsByCourse`、`attachCourseLevelRowSpans`
   - 序号按**课程数**计（非分组行）；课级列 rowspan：序号、代码、名称、类型、校选课类型、学分、课程组(ME)、先修
   - 列序：… → 学分 → **课程分组** → 课程组(ME) → 教师/周次/时间地点 → 先修 → 容量 → 操作
   - 分页 `total` = 课程数；同一课程所有分组行不跨页；页内 `.table-scroll` 纵向滚动（仅分组行超可视高度时出现滚动条）
   - ME：`sortSectionRowsBySelectionGroup` 组块相邻 + 组内同课分组连续；GE：`sortRowsByCourseThenSection`
   - 有余量/已满：先按课过滤，再展平（任一分组命中则保留该课全部 section 行）

9. **组名 / 备注 / 组感知分页（§9）**
   - 组名 demo：`Group1(Intake:2025/09~至今)`（半角 `~`；英文 `~Present`）
   - 三档 ME 批各 3 组：4选3 / 3选2 / 2选1 各一 demo，组块排在普通课前
   - 「备注」列在操作列前；组级 rowspan + i18n 整句（中/英）
   - 分页：`packPageUnits` 不拆选课组；每页仍按课程数上限 20
   - 布局：略减列 padding / min-width；除备注外字段 nowrap

10. **两行组名 / 50 门课 / ME 校选类型（§10）**
   - 课程组列：`groupLabel` + `intakeLineZh/En` 两行；英文第二行 `~Present`
   - `StudentRegisterView`：`pageSize` 默认 50（按课程数）
   - 主表与本节选课情况：`resolveSchoolElectiveCategory`；志愿 pending + SE201/WEB220 课库

11. **课程组列宽 / 合成时段不重叠（§11）**
   - 课程组列 132–140px；`Group{n}` 居中；intake 行 `nowrap`
   - 任课教师列 `max-width: 72px` + ellipsis
   - `synthesizeDemoMeetings`：追加段校验同周几不重叠；AI101 写死 meetings

12. **待开放预览已选=0 / 表头不换行（§12）**
   - `StudentPendingRoundPreviewPanel`：容量展示 `0/容量`；筛选按预览语义
   - 主表/预览表 `th { white-space: nowrap }`；容量列 `min-width: 7.5em`

## Risks / Trade-offs

- [分页切开同组] → **§8 修订**：按课程分页后同课不跨页；跨页时组块仍可能断开，组名单元格 rowspan 仍可读
- [筛选后组不完整] → 仍显示组规则「共 N 门」，学生可知有未出现在当前筛选结果中的课
- [与「课程分组」列名相近] → 列相邻但文案区分；i18n 明确

## Migration Plan

- 纯前端 demo；无持久化迁移。批次无 `selectionGroups` 时行为与现网一致（列全为 `—`、无色条）。

## Open Questions

- 无（列名「课程组」、文案「至少 M / 共 N 门」、无组显示 `—` 已在 explore 拍板方向）
