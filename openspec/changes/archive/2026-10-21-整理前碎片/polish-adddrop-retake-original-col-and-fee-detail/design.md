## Context

汇总表 `retakeLines` 已有 `replacesCourseCode` / `replacesCourseName`；费用框已按 action 汇总金额，但未展开 `feeEstimate.items`。

## Goals / Non-Goals

**Goals:** 原课程列展示；费用框三项展开计费过程。

**Non-Goals:** 改 SST 税率或应收学分算法。

## Decisions

1. 原课程文案：`{replacesCourseCode}/{replacesCourseName}`；缺名称时同课重修回退本行 `courseName`；都空则「—」。
2. 费用明细：按 `feeEstimate.items` 拆加课/重修；每行 `课号 · 科类 · 应收 n 学分 × rate RMB = amount RMB`；无行时该项仅显示 `0 RMB`。
3. SST：`sstAmount > 0` 时展示 `课程费合计 × rate% = sst`；否则 `0 RMB`。
4. 详情费用框与表单同步同一展示结构。

## Risks / Trade-offs

- [replaces 字段缺失] → 回退 courseCode/courseName，避免空白。
