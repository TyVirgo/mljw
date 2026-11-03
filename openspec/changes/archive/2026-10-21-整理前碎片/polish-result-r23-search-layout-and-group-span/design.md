## Context

结果页 scoped 样式把区间 label 拉满宽，叠加 cr 列表样式后搜索呈「标签在上」；ME 课程组需一级展示并合并。

## Goals / Non-Goals

**Goals:** 搜索横向；ME 课程组首列（勾选后）+ 同组 rowspan + 组感知分页  
**Non-Goals:** 不改过滤语义；不动 R1

## Decisions

### 1. 搜索样式

去掉 `.search-item-range > label { width:100% }`；结果页搜索 `.search-item` 强制 `flex-direction: row`；窄数字框保留。

### 2. 组级 span

新增 `attachSelectionGroupColumnSpans(rows)`：连续相同 `selectionGroup.id` 合并 `_span.selectionGroup`；无组每行 rowspan=1 显示 —。

### 3. 行管道（ME R2/R3）

```
listRoundCourseSummaries
  → 挂 course stub
  → sortSectionRowsBySelectionGroup
  → paginateSectionRowsByCourse({ groupAware: true })
  → attachSelectionGroupColumnSpans
```

列序：勾选 | 课程组 | 序号 | 批次 | 代码 | 名称 | 学分 | 容量四列

## Risks / Trade-offs

- [Trade-off] 大组超过 pageSize 时整组占一页 — 与在线选课一致

## Migration Plan

无。

## Open Questions

无。
