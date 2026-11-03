## Context

二层选课按原课过滤弹框池；确认时 `retakeLines = incoming` 整表替换，跨原课累加失败。

## Goals / Non-Goals

**Goals:** 按原课合并 retakeLines；汇总文案澄清。

**Non-Goals:** 弹框内展示他类已选课。

## Decisions

1. 有 `retakeFocusOriginal` 时：去掉与该原课匹配的旧行，再 append `incoming`。
2. 匹配：`replacesCourseCode` / `replacesTranscriptId` 对原课；或无替代信息时同课号/同 retakeCourseId。
3. 无 focus 时仍整表替换（兼容旧路径）。

## Risks / Trade-offs

- [替代课 replaces 字段缺失] → 回退按 courseId/code 与原课 retakeCourseId/code 匹配，避免误删。
