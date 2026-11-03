## Context

`coursePickerSelectedDropCredits` 已有 `{count}/{credits}/{original}/{remain}`，仅需调整中英文模板语序与用词。

## Goals / Non-Goals

**Goals:** 模板改为「退课前 → 退课 → 还剩」。

**Non-Goals:** 不改 Modal 传参。

## Decisions

1. 占位符名保持 `original` / `credits` / `remain`，避免改 Vue 调用。
2. 中文：「退课前学分合计」「退课学分合计」「还剩学分合计」。

## Risks / Trade-offs

- 无
