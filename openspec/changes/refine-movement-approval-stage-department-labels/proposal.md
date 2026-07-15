## 背景与动机

「Pending Review」是内部首节点 stage key，不是业务上的部门。审批时间轴节点标题与「待我审批」列表「审批阶段」列应展示流程图对应的**具体部门名称**（演示数据 `STAGE_ROLE_MAP` 英文部门名；中文为其直译）。

## 变更内容

- 新增 `formatApprovalStageLabel`：stage key → 部门展示名
- 列表「审批阶段」、时间轴节点标题、导出字段统一走映射
- 中文 flat i18n：部门英文名 → 直译中文

## 能力范围

### 修改的能力

- `movement-approval-app`：审批阶段展示文案

## 影响范围

- `movementApprovalLogDisplay.js`（或共用 stage 展示工具）
- `MovementApprovalView.vue`、`ApprovalTimeline.vue`
- `exportMovementApprovalExcel.js`
- `src/i18n/zh-flat.js`

## 非目标

- 不修改 store 内 `approvalStage` 存储值（仍可为 `Pending Review`）
- 不改审批推进逻辑 / 角色匹配
