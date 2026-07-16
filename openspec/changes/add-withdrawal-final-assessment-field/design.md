## Context

`WithdrawalFormModal` SECTION II 现为 Whereabout / Destination / Last Date / Main Reason / Detailed Reason。产品增加 Final Assessment 确认，并重排第二行。

决策确认（2026-07-15）：
- 选 Yes → **自动填写** Exam week 最后一天，**可二次调整**
- 两个字段 tooltip **始终展示**（不随 Yes/No 显隐）
- 原型用 mock 考试周末日，不接真实校历

## Goals / Non-Goals

**Goals:**
- 必填 Yes/No + 重排布局 + 常显 tip
- Yes 时预填 mock 考试周末日且可改

**Non-Goals:**
- 真实 Exam week 计算；锁定日期；No 时改 tip 文案

## Decisions

1. **字段名**：`completeFinalAssessment`，取值 `'' | 'Yes' | 'No'`（与现有 Yes/No 文案一致）。

2. **Mock 考试周末日**：新增 `getExamWeekLastDayForSession(session)`（或按申请日固定落一 mock ISO），根据 `applicationSession` / `currentAcademicSession` 取映射；无映射则用稳定默认日期（如当前演示学期末一日）。写入时机：用户将下拉改为 `Yes` 时赋值；已改为 Yes 后再次切换不强制覆盖手动值——仅在「刚变成 Yes」或日期为空时写入。

3. **Tooltip**：复用 `DefermentFormModal` 的 `field-hint-tip-wrap` / `?` 样式；文案 i18n：
   - `completeFinalAssessmentHint`：产品提供的英文句 + 中文翻译  
   - `lastDateOfAttendanceHint`：说明 Yes → Exam week 最后一天

4. **详情**：只读展示 Yes/No 标签与日期。

## Risks / Trade-offs

- [Risk] mock 日期与真实校历不符 → Mitigation：tip 已说明规则；后续可换真实数据源
- [Risk] Yes→No→Yes 是否再次覆盖手改 → Mitigation：仅在切入 Yes 且（策略选空时填 / 或每次切入 Yes 都重填）；推荐「切入 Yes 时总是写入 mock 日期，用户可再改」，实现简单、与「自动填写」语感一致

## Open Questions

（已关闭）
