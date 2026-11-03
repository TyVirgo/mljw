## Context

弹框灰行原因用 `coreMustSameSectionReadd`；原课程操作列上次整列右齐导致 th 也靠右。

## Goals / Non-Goals

**Goals:** 原因文案改写；操作列 th 左 / td 右。

**Non-Goals:** 闸门算法、tip。

## Decisions

1. 只改正文案键值，不改 `errorKey` 名。
2. CSS：`th.col-op--retake-original` 左；`td.col-op--retake-original` 右。

## Risks / Trade-offs

- （低）纯文案/样式。
