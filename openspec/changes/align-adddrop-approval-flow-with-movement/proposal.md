# 提案：加退课审批详情/批量对齐学籍（流程图 + 审批内容）

> 与 `align-adddrop-approval-with-movement-layout`（列表壳：Tab/搜索等）拆分；本包专注审批交互同构。

## Why

加退课详情目前在抽屉内嵌「意见 + 驳回/批准」，无学籍式审批流程图；批量审批亦缺统一「审批内容」弹窗。需与学籍异动审批一致：详情看流程与申请，点「审批」填写 Action/Comments。

## What Changes

1. 详情顶部增加 `ApprovalTimeline`（简化：提交 → 教务协调员）。
2. 详情 footer：关闭 + 审批；去掉内嵌驳回/批准与决策区块。
3. 新增加退课审批弹窗（对齐学籍：结果单选、意见、常用意见、二次确认；通过时可勾选生成账单）。
4. 待办列表：勾选列 + 工具栏「审批」；批量共用同一弹窗。
5. 行操作统一为「详情」。

## Non-goals

- 不改学籍审批；不实现多级并行会签。
- 列表搜索字段扩维、Tab「待我审批」文案等仍归 layout 提案。

## Capabilities

### Modified Capabilities

- `course-reg-approval`：详情流程图 + 单条/批量审批内容弹窗

## Impact

- `AddDropApprovalView`、`AddDropApprovalDetailDrawer`
- 新建 `AddDropApprovalModal`；timeline 构建函数；队列决策 API 微调
