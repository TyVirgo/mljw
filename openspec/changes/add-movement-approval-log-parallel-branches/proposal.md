## 背景与动机

审批日志时间轴需按会签并行语义展示：**分支开始 → 多分支卡片 → 分支汇聚**。审批推进仍可 v1 串行写 log；仅展示层按 `getParallelGroups` 折叠。Demo 需含混态会签（通过 / 待审 / 需修改）。

## 变更内容

- `buildMovementTimelineNodes`：按 parallel group 输出 `branch-start` / `parallel-item` / `branch-join`
- `ApprovalTimeline`：并行区块样式（蓝竖线、意见框、汇聚文案）
- 休学 demo 增加会签进行中样例
- i18n：分支开始 / 汇聚文案

## 能力范围

### 修改的能力

- `movement-approval-app`：审批日志并行分支展示

## 影响范围

- `buildApprovalTimelineNodes.js`、`ApprovalTimeline.vue`
- `movementApprovalWorkflows.js`（复用 getParallelGroups）
- `deferments.js` demo
- `zh.js` / `en.js` `approvalTimeline`

## 非目标

- 不改造审批引擎为真正并行推进
- 转专业等无 parallelGroup 的流程保持线性
