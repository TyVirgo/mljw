## Why

未审估算说明目前藏在悬停「！」里，且无二次申请时仍可能露出感叹号；同类型互斥与底账把主表 demo 种子待审单也算进去，首次真实提交前就误判为「第二次申请」。

## What Changes

- 有学生真实新提交的未审单时：学分情况蓝条内**直接展示**估算说明文案（可带左侧装饰感叹号，不作 tooltip）。
- 无此类未审单时：整条估算说明（含感叹号）不渲染。
- 「第二次申请」判定（底账叠加、估算 tip、同主类型红字互斥）仅认学生端 `submitStudentAddDropApplication` 新交的未审单；主表/种子 demo 待审行不参与。

## Non-goals

- 不删除或改写主表 demo 待审数据（列表展示可继续存在）。
- 不改审批弹窗学分条口径、不改已通过写回课表逻辑。

## Capabilities

### New Capabilities

- `adddrop-pending-tip-real-submit-gate`: 估算文案直出 + 仅真实新提交未审判定二次申请

### Modified Capabilities

- （无）

## Impact

- `StudentAddDropView.vue` / `AddDropTermCreditStrip.vue`
- `addDropMultiItems.js`（可选：学生新提交识别 helper）
- `addDropApprovalQueue.js`（提交时标记，若采用显式字段）
- i18n 文案键可复用 `pendingEstimateTip`
