## Context

`listRoundCourseSummaries` 已按本轮名单输出已选/总量与特殊新加。选课结果页仍保留「第一轮志愿结果」与「轮次维度」双入口；志愿表一行一分组且课字段重复，与在线选课 rowspan 不一致。

## Goals / Non-Goals

**Goals:**

- 同批筛选下三轮行集合可区分；R2/R3 ≥25 课行、默认 20/页
- 容量三列 + 特殊新加（课级）
- 顶栏「课程维度」+「学生维度」；去掉独立志愿 Tab
- 第一轮：志愿能力与容量列融合；同课多分组 rowspan（对齐在线选课）；按课分页
- 第一轮保留发布/发布日志工具栏

**Non-Goals:**

- 不换批次绑定；不改管理课程抽屉表头；R2/R3 不做分组 rowspan；添加特殊学生仍在学生维度

## Decisions

### 1–4.（既有）分轮种子、已选口径、特殊新加抽屉、表头专用 i18n

见前版；已实现。

### 5. 顶栏信息架构

```
[ 课程维度 ]  [ 学生维度 ]
     │
  R1 融合表 | R2 课级 | R3 课级
```

- 删除 `activeTab === 'volunteer'`
- `tabRound` 文案改为「课程维度」；默认 `activeTab='round'`, `selectedRound='preselect'`

### 6. 第一轮行模型 + rowspan

- 数据源：`listVolunteerCourseSummaries`（分组行）∪ 按 `courseId` 挂 `listRoundCourseSummaries('preselect')` 的容量/特殊新加
- 行结构带 `course` / `section`，走 `attachCourseLevelRowSpans`（或 `attachTableRowSpans`）
- **课级合并列**：序号、批次、代码、名称、类型、学分、有效最大/新生/老生（已选/总量）、特殊新加
- **分组列**：课程分组、志愿数量/老生容量、已选%、志愿名单
- 分页：`paginateSectionRowsByCourse`，`pageSize` 表示每页课程数

### 7. 第二/三轮

保持现有一行一课容量表 + 特殊新加；工具栏删除/导出（无发布）。

### 8. R1 数字关联（口径 A）

- 隐藏新生列。
- 分组选上：GE/ME 用 `volunteers.filter(v => v.selected).length`；否则 `min(志愿数, 分组老生容量)`。
- 课级：`seniorEnrolled = Σ 分组选上`，`seniorCap = Σ 分组老生容量`。
- `effectiveEnrolled = seniorEnrolled`，`effectiveTotal = seniorCap`。
- 特殊新加仍来自 round 名单 `specialExtra`，不进已选。

## Risks / Trade-offs

- [Risk] 志愿无状态但有轮次名单的课不出现在 R1 → 以志愿表为主；缺课可后续补种子  
- [Risk] 按课分页后「共 N 条」语义变为课数 → 文案/total 按课计数  
- [Trade-off] 容量已选与课库 enrolled 可不一致 — 以轮次名单为准

## Migration Plan

纯前端；无持久化迁移。

## Open Questions

无（容量三列+特殊新加挂课级 rowspan 已确认）。
