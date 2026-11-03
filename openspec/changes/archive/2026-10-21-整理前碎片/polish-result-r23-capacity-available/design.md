## Context

`listRoundCourseSummaries` 当前输出已选分子；R1 与 R2/R3 共用部分 i18n 键名。

## Goals / Non-Goals

**Goals:** R2/R3 展示与筛选改为可选；R1 不变  
**Non-Goals:** 不改特殊新加、不改弹窗写回

## Decisions

### 1. 计算公式

```
availableTotal    = max(0, totalCapacity - enrolledTotal)
availableFreshman = max(0, freshmanCap - enrolledFreshman)
availableSenior   = max(0, seniorCap - enrolledSenior)
effectiveLabel    = `${availableTotal}/${totalCapacity}`
```

### 2. i18n

新增：`effectiveCapacityAvailableWithRatio`、`freshmanCapacityAvailable`、`seniorCapacityAvailable` 及 tip/搜索区间键。R1 继续用原 `*Enrolled*` / `effectiveCapacityWithRatio`。

### 3. 筛选

区间字段改为筛 `available*`；表单键名改为 `effectiveAvailableMin/Max` 等（旧 enrolled 键标记弃用保留空默认以免引用报错）。

## Risks / Trade-offs

- [Risk] freshmanCap/seniorCap 为 0 时可选恒为 0 — 与配额数据一致

## Migration Plan

无。

## Open Questions

无。
