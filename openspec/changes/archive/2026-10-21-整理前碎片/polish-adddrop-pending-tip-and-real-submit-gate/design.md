## Context

`align-adddrop-pending-ledger-and-approval-strip` 已落地未审底账与同类型互斥，但：

1. `AddDropTermCreditStrip` 把 `pendingEstimateTip` 放进「！」的 `title`，文案不可见。
2. `pendingLedgerApps` 过滤当前生全部 Pending/In Review，包含 `studentDemoSeed` 的 `adr-xmum-*` 种子单，导致一进表单就红字/估算 tip。

学生真实提交由 `submitStudentAddDropApplication` 生成，`id` 前缀为 `adr-stu-`。

## Goals / Non-Goals

**Goals:**

- 估算说明在蓝条内直出；无真实二次未审时整条（含感叹号）不渲染。
- 底账 / tip / 同类型互斥仅基于学生新提交未审单。

**Non-Goals:**

- 不清理主表 demo 行；不改审批条 pending 计入规则。

## Decisions

1. **识别真实新提交**：`isStudentSubmittedAddDropApplication(app)` → `String(app.id).startsWith('adr-stu-')`。不另加字段，避免改 seed 与历史持久化形态；与现有提交路径一致。
2. **过滤点**：`StudentAddDropView` 的 `pendingLedgerApps` 在 pending 状态之外再要求学生新提交。下游 `showPendingEstimateTip`、`primaryTypePendingBlocked`、`applyPendingLedger*` 自然跟着收窄。
3. **Tip UI**：`showPendingEstimateTip` 为真时，在既有蓝条内展示左侧装饰「！」+ 可见文案（`pendingEstimateTip`）；去掉 `title` tooltip。无 tip 且无学期情况文案时不渲染该 `<p>`。

## Risks / Trade-offs

- [Risk] 仅靠 id 前缀，若将来改学生提交 id 规则会漏判 → Mitigation：helper 集中一处，注释标明约定。
- [Risk] demo 重种 `filter(studentId !== DEMO)` 仍会清掉同生的 `adr-stu-*` → 既有行为，本变更不扩 scope。

## Migration Plan

无数据迁移；刷新后仅真实新提交未审触发 tip/互斥。
