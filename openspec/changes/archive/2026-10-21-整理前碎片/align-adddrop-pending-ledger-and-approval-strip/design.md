## Context

审批弹窗 `buildApprovalDecisionTermCreditStrip` 只计 `approved`，打开时行多为 `pending` → 条回到申请前。学生表单基线不读待审 items。

## Goals / Non-Goals

**Goals:** 审批条与详情一致；三类未审进底账；估算「！」；同类型待审互斥。

**Non-Goals:** 不改审批写回课表。

## Decisions

1. **审批条**：`approved` 与 `pending` 均计入投影；`rejected` / `update_required` 不计。打开即与详情快照同口径。
2. **未审集合**：当前生 `Pending` | `In Review`，三类主类型全部并入（非仅同类型）。
3. **底账**：`liveBaseline` + 未审 apps 的 Drop/Add/Retake items → `termCreditStripBaseline`；`pendingDropCodes` / 加课并入拟退含未审 Drop；退课可选列表排除已在未审中拟退的课。
4. **「！」**：`AddDropTermCreditStrip` 新增 `showPendingEstimateTip`；有未审且表单打开时为 true。
5. **互斥**：`primaryTypeFromAction(pending.type)` 命中当前主类型 → 红字 + `formLocked` 禁用选课/提交。

## Risks / Trade-offs

- [多张未审叠加顺序] → 按队列顺序依次投影  
- [未审加课未真正入课表] → 底账仅学分/拟退侧估算，加课池仍以资格+拟退为主
