# 设计：加退课审批流程对齐学籍

## Decisions

1. **详情**：`ApprovalTimeline` 在申请内容之上；footer 仅「关闭」「审批」（可审模式）。
2. **弹窗**：仿 `MovementApprovalModal`；动作 Approved / Rejected / Update Required；Update Required 记日志并保持 Pending。
3. **账单**：`generateBill` 仅在选 Approved 时显示于弹窗。
4. **批量**：待办勾选 → 同一弹窗；批量通过时跳过选课队列灯箱，直接写队列。
5. **Timeline**：`buildAddDropTimelineNodes(app)`，节点字段兼容 `ApprovalTimeline`。

## Risks

- 批量含加课申请时无队列动画，与单条略有差异（原型可接受）。
