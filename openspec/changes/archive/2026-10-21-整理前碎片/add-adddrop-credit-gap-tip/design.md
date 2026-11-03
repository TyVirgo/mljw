## Context

`AddDropTermCreditStrip` 含毕业 GE/ME 已选/要求；条下无说明。审核详情用申请上的 `termCreditStrip`。条带无「毕业必修已选/要求」，未修提示仅能可靠汇总 GE/ME。

## Goals / Non-Goals

**Goals:**

- 加课 / 加退课：条下 tip
- 缺学分：`你目前毕业累计未修学分：GE：{ge}学分，ME：{me}学分；`（英文类型名）
- 无缺：`你目前均修满学分，无可选课程。`
- 样式：info callout 底色
- 详情/审批同源

**Non-Goals:**

- 不写 programme study plan
- 不虚构条带没有的毕业必修差额（条无该列则 tip 不含 Mandatory）
- 退课/重修不显示此 tip

## Decisions

1. **差额**：`geGap = max(0, gradGe.max - gradGe.current)`，ME 同理；任一 >0 为缺学分态。
2. **可见性**：`action/type ∈ {Add, AddDrop}` 且 strip 存在时显示。
3. **挂载**：在 `AddDropTermCreditStrip` 内可选 `showGapTip` + `applicationType`，或 FormSections/DetailBody 条下插 `CourseRegistrationCallout`。优先抽 `resolveAddDropCreditGapTip(strip, type)` + 薄展示组件/片段，避免重复。
4. **demo**：现有 6/18、11/24 即缺学分默认态，不改种子也可。

## Risks / Trade-offs

- [无毕业必修列] → tip 不含必修课差额；若产品后续加列再补
