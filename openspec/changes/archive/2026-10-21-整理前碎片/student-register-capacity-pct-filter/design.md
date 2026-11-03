## Context

R1 列 `sectionCapacityLabel` 用 `getSectionVolunteerDisplayCount / capacity` 显示百分比；搜索 `availability` 却走 `filterCoursesBySectionAvailability` 的 enrolled/capacity，且课级「任一命中保留整课」。

## Goals / Non-Goals

- Goals：R1 选项与谓词对齐列百分比；**行级**过滤；R2/R3 行为不变。
- Non-Goals：不改百分比展示取整规则以外的业务；不改 waitlist 其它页的 open/full 文案复用处（可新增独立 key）。

## Decisions

1. **选项 value**：R1 用 `lt100` / `gte100`；R2/R3 仍 `open` / `full`。
2. **比较**：`volunteers / capacity`，`< 1` vs `≥ 1`；`capacity ≤ 0` 的行在百分比筛下排除。
3. **粒度**：在展平 `sectionRows` 后按行过滤（R1）；R2/R3 继续课级 `filterCoursesBySectionAvailability`。
4. **轮次切换**：若当前 `availability` 不属于本轮合法值，清空为全部。

## Risks / Trade-offs

- 行级过滤后同一门课可能只剩部分分组行，rowspan 需仍由现有聚块逻辑处理（过滤后再 build/sort）。

## Migration

- 无持久化兼容问题；内存搜索态切轮次时清空非法值即可。
