## Context

原课程表已具备外层 Tab 与多行成绩；当前列序为「类型在首、操作左齐」，同页退课/加课表为「类型靠后、操作收尾」。

## Goals / Non-Goals

**Goals:** 列序与操作右对齐对齐同页表习惯。

**Non-Goals:** 数据逻辑、Tab、弹框。

## Decisions

1. 仅调整原课程表 `thead`/`tbody` 列顺序与 `.col-op--retake-original` 的 `text-align: right`。
2. 不改全局 `.col-op`，避免牵动退课/加课表。

## Risks / Trade-offs

- （低）仅视觉；无数据风险。

## Open Questions

- （无）
