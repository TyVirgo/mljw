## Decisions

1. **催缴计数**：`approveAddDropApplication` 写账单时 `paymentRemindCount = 0`（覆盖旧「默认 1」）；`incrementPaymentRemindCount` 为 `(n||0)+1`。历史 demo 已为 1/2 的样例可保留。
2. **live 合并**：`collectLiveUnpaidLines` 纳入 `Approved` 与 `PartiallyApproved`；导出 `mergeLiveUnpaidFromApproval()` 在已灌种后仍按 id 追加新行，不删 seed。
3. **触发点**：审批通过成功后调用 merge（当前登录学生）；`ensureStudentCoursePaymentSeeded` 在 hydrated 时也调用 merge。避免 `addDropApprovalQueue` ↔ payment store 循环依赖：审批侧用动态 import 或把 merge 挂在 payment store、审批里 `import()`。
4. **课名**：live 行优先 `item.courseName`。
