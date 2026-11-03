## Context

`formOpsDisabled` 时滚动区 `pointer-events: none`，但 `.form-grid:first-of-type` 整格 `pointer-events: auto`，导致「是否退课」等也可改。`dropFormApprovalHint` 在 `isDropAction` 时显示于弹窗底部。

互斥已由 `primaryTypeFromAction` 三分，本变更不改判定算法，仅在规格中写明。

## Goals / Non-Goals

**Goals:**

- 互斥时仅申请类型 `<select>` 可交互。
- 去掉退课主类型底部审批队列提示条。
- 规格确认三类互斥边界。

**Non-Goals:**

- 不改 `primaryTypePendingBlocked` / `adr-stu-*` 过滤逻辑。

## Decisions

1. **可点范围**：给申请类型字段加 class（如 `adddrop-primary-type-field`），ops-disabled 时只对该字段（及内部 select）`pointer-events: auto`；去掉「整块 first form-grid 放开」。
2. **是否退课**：互斥时保持不可改（不再被 first-grid 放开）。
3. **提示条**：删除 `StudentAddDropView` 中 `CourseRegistrationCallout` + `dropFormApprovalHint`；i18n 键注释弃用原因，不删键以免其它潜在引用。
4. **三类互斥**：维持现有 `primaryTypeFromAction`；实现侧无需新 helper，spec 写清场景即可。

## Risks / Trade-offs

- [Risk] 学期只读字段也在 first-grid，收紧后仍只读无妨 → 可接受。
