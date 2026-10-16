## Decisions

1. **缴费名单**：`appendFeeRosterFromApproval` 继续写 unpaid；`upsertFeeRosterFromPaymentLines` 按 studentId+courseCode（及 sourceRef/applicationNo 若有）匹配，`status===paid` → `paid=Y`/`paidAt`/`outstandingFee=N`；未匹配到且 unpaid 的审批源行可补插。覆盖「与学生端解耦不灌数」旧口径。
2. **RetakeDrop**：提交用 `hasSameCourseSameSectionOverlap`；选课器用与加课相同的同课同分组禁用（`isRowBlockedByDropSameSection` 扩展至 RetakeDrop）；删除同课号禁用路径。提示 key 复用 `addDropSameCourseSameSection` 或专用重修文案。
3. **已满**：`seatStatusTip`/`seatStatusLabel` 在 full 时用 `pickerStatusFullTip`：`该教学分组名额已满（{remaining}/{total}），不能选择`。
