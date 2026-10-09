## Context

入口卡 `.cr-type-entry-credits` 为两行独立 flex，总分胶囊宽度不同导致明细错位。列表 `.cr-credit-matrix` 已是单 grid 两行。

## Goals / Non-Goals

**Goals:** 入口卡两行列对齐；GE 短标签统一长度。

**Non-Goals:** 改详情/监控里的完整类别名。

## Decisions

1. i18n：`geDemand.short` → GE01–GE04。
2. 入口卡将毕业/学期学分折叠为 `.cr-type-entry-credit-matrix` 单 grid（标签 | 总分 | | | 4 明细）。

## Risks / Trade-offs

- [窄屏换行] → grid 允许横向滚动或卡片内自适应；入口卡本身较宽
