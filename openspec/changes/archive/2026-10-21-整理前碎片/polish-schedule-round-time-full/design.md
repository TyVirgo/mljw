## Context

截断来自 `.col-round { max-width: 240px }`、`td` ellipsis，以及 `AudienceRoundDualCell.compact` 行级 ellipsis。`compact` 本意仅去秒。

## Goals / Non-Goals

**Goals:** 主表三轮时间完整可见。

**Non-Goals:** 改日期格式算法。

## Decisions

1. `.col-round` 去掉 `max-width`，设足够 `min-width`，`overflow: visible`。
2. compact 去掉行级 ellipsis，保留去秒文案。
3. 表已有横向滚动，列加宽可接受。

## Risks / Trade-offs

- [表更宽] → 依赖既有 overflow-x
