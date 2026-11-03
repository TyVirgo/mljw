## Context

主表 / 待开放预览表头已有 `th-with-tip` + `hint-popover` 模式（校选课类型、课程分组）。

## Goals / Non-Goals

**Goals:** 两处「先修课」表头加 tip，文案中英 i18n。

**Non-Goals:** 不改 eligibility / 课库先修数据。

## Decisions

1. 复用现有 tip 标记，键名 `prerequisitesTip`，紧挨 `prerequisites`。
2. 中文按产品语义「来自」（用户原文「来着」视为笔误）。
