## Context

选课结果 `RegistrationResultView`：R1 已为「一行一课程分组」+ 课级 rowspan（`paginateSectionRowsByCourse` / `attachCourseLevelRowSpans`）；R2/R3 仍为一行一课（`listRoundCourseSummaries`），无分组/课程组列。ME 老生年级占比配置已存在于批次/课级 `meQuotaRows`，抽签侧用 `resolveMeQuotaRowsForCourse`，结果页未暴露。

## Goals / Non-Goals

**Goals:**

- R2/R3 行模型对齐 R1：教学班行 + 课级容量/特殊新加 rowspan；按课分页
- GE 显示课程分组；ME 显示课程分组 + 课程组（`resolveSelectionGroup`，文案对齐在线选课）
- ME 老生容量已选（R1/R2/R3）可点 → 只读弹窗展示年级占比

**Non-Goals:**

- 结果页不写回 meQuota；不改志愿定稿/发布
- 不按教学班拆分已选人数（容量数字仍课级，与 R1 一致）

## Decisions

### 1. R2/R3 数据：课摘要展平为分组行

- 新增 `listRoundSectionSummaries(roundKey, filters)`：先算课级摘要（保留/复用 `listRoundCourseSummaries`），再按 `course.sections` 展平；无分组时合成默认 `01`
- 行带 `course` / `section` / `selectionGroup`，`id` 仍用 `result-course-${courseId}`（勾选/删除按课，与现语义一致；同课多行共享 id）
- 视图侧：`paginateSectionRowsByCourse(..., { groupAware: isMeBatch })` 挂 `_span`

### 2. 列显隐

| 列 | GE | ME |
|----|----|----|
| 课程分组 | ✓ | ✓ |
| 课程组 | ✗ | ✓（rowspan，title + intake 行） |

课程分组文案：`sectionNameDisplay`（与 R1 相同）。

### 3. ME 老生配额只读弹窗

- 组件：`MeSeniorQuotaReadonlyModal`（或抽屉），内嵌 `MeQuotaRowsEditor` 新增 `readonly` prop：隐藏新增/删除/操作列，输入禁用
- 打开时：`resolveMeQuotaRowsForCourse(course, batch)` + `getCourseSeniorQuotaTotal`；标题含课号/课名
- 空配置：表格空 + 简短提示「未配置老生年级占比」
- 触发：`batch.type === 'ME'` 时老生容量单元格为 `link-btn`（含 0）

### 4. R1 同步

- R1 课级「老生容量」在 ME 批次同样可点，复用同一弹窗（按 `courseId` 取课与批次）

## Risks / Trade-offs

- [Risk] Pad 演示课无 sections → Mitigation：展平时合成默认分组
- [Risk] 同课多行共享勾选 id → Mitigation：全选按页去重；与「按课删除」一致
- [Trade-off] 已选人数不按分组拆分 — 对齐 R1 课级 rowspan 口径

## Migration Plan

纯前端 mock；无持久化迁移。

## Open Questions

无。
