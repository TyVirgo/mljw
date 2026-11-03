## Context

换组锁 tip 与文案拆成两个 flex 子项导致「？」换行；`mergeEligibleAddWithPendingDropCores` 未写入学期。

## Goals / Non-Goals

**Goals:** tip 贴句号；原上课学期有值。

**Non-Goals:** 不改锁逻辑。

## Decisions

1. 锁文案与「？」包在同一 `inline` 容器内，tip 用 `inline-flex` + `vertical-align`，父级取消把 tip 拆成独立 flex 换行项。
2. `mergeEligibleAddWithPendingDropCores(rows, drops, { fallbackAcademicSession })`：  
   `line.academicSession || line.originalAcademicSession || existing || fallback`。
3. View 传入当前申请学期；demo 必修 MATH101/PHYS101 补 `academicSession`；`mapRequired` / `buildLineFromSelection` 带上学期字段。
