## Context

详情与申请共用 `retakeOriginalCourse` 文案；详情列 `table-layout:fixed` + nowrap 导致截断。审批 `sectionLabel` 优先传 `section` 码，忽略 `sectionName`。校验侧曾有「整课号禁止」文案，与「同课异组合法」冲突。

## Decisions

1. i18n：`retakeOriginalCourse` →「曾修课程」；`retakeDropSameCourse` 标记弃用并改指向同组禁令语义（或改文案为同组说明，实际校验用 `retakeDropSameCourseSameSection`）。
2. 详情 CSS：`.col-retake-original` 允许换行、加宽；覆盖全局 ellipsis。
3. `sectionLabel(item)` 传入 `{ sectionCode, sectionName }`。
4. `validateAddDropSectionForm`：RetakeDrop / AddDropRetake 对 drop∩retake 调用 `hasSameCourseSameSectionOverlap`，命中则 `retakeDropSameCourseSameSection`。
5. Demo：Pending `AddDropRetake` 含 Drop MATH101 section 01 + Retake MATH101 section 02。

## Risks

- 已提交的同课同组脏 demo 提交时会被新校验拦住（仅前端表单；历史队列行仍只读展示）。
