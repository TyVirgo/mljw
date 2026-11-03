## Context

`AddDropApprovalModal` 在有 `application.items` 时展示课程行 + 行决策；2026-10 曾把意见下沉为表下公共 Comments。现需行级意见，且不挤占操作列宽度（按钮触发二级弹层）。

## Goals / Non-Goals

**Goals**

- 每行独立 `lineCommentsMap[key]`
- 二级弹层复用 Comments UI（常用意见、200 字）
- 不通过 / 驳回行必填该行意见；通过行可选
- 持久化到 `item.lineComment`；`approvalLog.comment` 用「课号: 意见」拼接

**Non-Goals**

- 批量无行表路径
- 详情抽屉强制展示行意见 UI（字段先写入，展示可后续）

## Decisions

1. **状态**：`lineCommentsMap` 与 `lineDecisionsMap` 同 key（`addDropLineKey` / idx）。
2. **必填**：仅当该行 `rejected` 或 `update_required` 时校验该行意见非空；错误文案沿用/微调 `lineCommentRequired`。
3. **整单 comment**：有行意见则 `课号: 意见` 用中文分号拼接，供 log；无意见行为空串。
4. **批量**：`showSharedComments = showWholeForm`（仅无行表时显示底部 Comments）。
5. **覆盖旧规**：旧「表下公共 Comments」增量作废，以本变更 spec 为准。

## Risks / Trade-offs

- 操作列变宽：按钮用紧凑文字链样式，允许 op 列略增宽。
- 嵌套 modal 层级：二级 z-index 高于审批弹窗。

## Migration

- 无存量迁移；历史申请可无 `lineComment`。
