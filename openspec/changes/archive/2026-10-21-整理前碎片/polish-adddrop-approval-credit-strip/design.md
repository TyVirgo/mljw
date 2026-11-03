## Decisions

1. **计入规则**：仅 `lineDecision === approved` 的行进入 `dropCourses` / `addCourses`；pending / rejected / update_required 均不计入。
2. **组件**：复用 `AddDropTermCreditStrip` + `buildAddDropTermCreditStrip`。
3. **基线**：`app.termCreditStripBaseline` 优先；否则 `inferTermCreditStripBaseline(app.termCreditStrip, items)`；再否则 demo 默认数。
4. **批量审批**（无 application 明细）：不展示学分条。
5. **提交**：`buildAddDropSectionPayload` / 创建申请写入 `termCreditStripBaseline`。
