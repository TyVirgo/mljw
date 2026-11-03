## Context

tip 受 `shouldShowAddDropCreditSituationTip(applicationType)` 限制；必修 tip = max−学期已选。

## Decisions

1. `showSituationTip`：有 strip 即 true。
2. tip 必修：`mandatoryRequired − (priorMandatory + strip.gradMandatory.current)`；GE/ME 仍用 strip 缺口。
3. `DEMO_PRIOR_EARNED_CREDITS.mandatory` 调至使默认剩余约 30。
4. 标签 `font-size: 12px`，保留 `nowrap`。
