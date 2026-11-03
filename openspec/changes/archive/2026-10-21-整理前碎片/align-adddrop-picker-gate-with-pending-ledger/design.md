## Context

`termCreditStripBaseline` 已 `applyPendingLedgerToTermCreditBaseline`；`termCreditGate.currentCredits` 与 `handleSubmit` 仍读 `creditSummary.enrolled`。

## Goals / Non-Goals

**Goals:** 选课超帽、提交超帽、表单 `currentCredits` 与未审底账净学分一致。

**Non-Goals:** 不改 pending 过滤（仍 `adr-stu-*`）；不改 GE 学期帽（已用 strip baseline）。

## Decisions

1. **净学分计算**：`pendingAdjustedTermCredits = computeNetCreditsAfterLines(enrolled, pendingDropLines, pendingAddLines)`，其中 pending 行来自已有 `pendingLedgerLines`。
2. **gate**：`currentCredits: pendingAdjustedTermCredits`；`dropLines`/`addLines` 仍为当前表单。
3. **提交**：超帽与 `validateAddDropSectionForm` 的 `currentCredits` 同用该值。
4. **不双扣**：pending 已进 currentCredits，不再并入 gate.dropLines。

## Risks / Trade-offs

- [Risk] pending 行缺 credits 字段 → Mitigation：与学分条同源 line，既有提交路径应带 credits。
