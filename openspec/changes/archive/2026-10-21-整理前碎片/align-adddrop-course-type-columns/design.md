## Decisions

1. **课程类型 ≠ 申请类型**：明细行「课程类型」用 `getRegistrationTypeLabel(course.type)`（Core/ME/GE 等）；申请类型（加课/退课/重修）仍用既有 `addDropType*` / `approval.typeLabel`。
2. **列位**：表单/详情在组别或名称后、学分前；审批在课程名称后、学分前（保留首列申请类型）。
3. **缺 type 回落**：`item.type` → snap → `getCourseById` / `getCourseByCode`；重修详情可再回落 `app.courseType`。
4. **表头可读**：`th.col-type` / `col-course-type` / `col-seats` 使用 `overflow: visible` + `text-overflow: clip`，表体可横向滚动（`min-width` / `overflow-x: auto`）。
5. **操作列不裁切**：`col-op` / `op-cell` 宽约 16–18em、`overflow: visible`；三态 radio 保持单行 nowrap；表 `min-width` 抬至约 1280px，窄屏靠横向滚动而非挤压操作列。
