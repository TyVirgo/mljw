## Decisions

1. 本学期：以 `getActiveBatch()?.academicSession` 为准过滤 `listMyResultCoursesByType('all')` 后求和 credits。
2. 展示与筛选解耦：`resolveUnifiedCourseCategoryCode` 仍返回 `GE01`；`formatUnifiedCourseCategoryLabel` 输出 `GE-01`。
3. `unifiedCourseCategoryFilterOptions` 的 `value` 不变、`label` 改为带连字符。
