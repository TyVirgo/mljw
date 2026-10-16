## Context

`polish-adddrop-approval-presets-excess-table` 为减少横滑给紧凑列加了 `width: 1%`，表头 `white-space: normal`，导致「是否退课」「超出学分」「发送邮件次数」一字断行。缴费侧 `collectLiveUnpaidLines` 未带 `studentName/programme/intake`，`upsertFeeRosterFromPaymentLines` 插入空壳行，聚合因超学分仍展示。

## Goals / Non-Goals

**Goals:**

- 紧凑列表头最多约两行、可读，不出现单字竖排
- 缴费名单行具备合理姓名（及尽量补全专业/批次）；无姓名脏行不进列表

**Non-Goals:**

- 不保证所有分辨率零横滑
- 不重建学生主数据服务

## Decisions

1. **表头**：去掉盲目 `width: 1%`；为 needDrop / excessCredits / paymentRemindCount 等设 `min-width`；`thead th` 使用 `word-break: keep-all` + 约两行高（`line-height` + 可选 `line-clamp: 2`）。单元格数据仍可 `nowrap`。
2. **缴费源头**：`collectLiveUnpaidLines` 从审批单写入 `studentName/programme/intake/academicSession`。
3. **写入兜底**：`upsertFeeRosterFromPaymentLines` 插入/更新时，缺姓名则从同 `studentId` 已有行或 `getStudentProfileFields()`（同学号时）回填；已有脏行 map 时一并补字段。
4. **展示过滤**：`aggregateFeeRosterStudents` 跳过 `studentName` 空白的聚合行（演示卫生）。

## Risks / Trade-offs

- [min-width 回调横滑] → 仅紧凑列给下限，继续控制 padding
- [过滤无姓名行丢真实欠费] → demo 场景优先卫生；正式环境应走补全而非静默丢弃（本仓库为本地 mock）
