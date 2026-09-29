## Context

第一轮表 class：`data-table round-dim-table round1-merge-table`，padding 来自 `course-registration-list.css` 的 `10px 12px`。

## Goals / Non-Goals

**Goals:** 仅缩小 R1 合并表行高，贴近紧凑列表（约 6–8px 垂直 padding）。

**Non-Goals:** 全局 data-table、R2/R3、学生维度。

## Decisions

1. 在 `RegistrationResultView.vue` 为 `.round1-merge-table th, td` 覆盖 `padding: 6px 10px`。
2. 保留 `td[rowspan] { vertical-align: middle }`。

## Risks / Trade-offs

- [过紧影响可读] → 取 6px，必要时可调到 8px
