## Decisions

1. **闸门**：`isRowBlockedByDropSameSection` 在 `action === 'Retake' | 'RetakeDrop' | 'Add' | 'AddDrop'` 且 `dropLines.length` 时生效（纯重修无退课行则不拦）。
2. **文案**：重修模式（含 Retake 映射）用 `retakeDropSameCourseSameSection`。
3. **比对键**：`courseSectionMatchKey` 优先 `courseCode/code` 与 `sectionCode/section.code`，再回落 id，保证退课清单与重修池分组可对齐。
