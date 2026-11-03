## Context

- 名额列读 `section.capacity` / `remainingCapacity`；CORE 在 `selectableCourses` 仍为 40，加退与在线选课共用课库。
- `addNotes` 仅加课 Section 渲染；重修费用在 `showBottomFeeBox` 后直接进声明。
- RetakeDrop 提交注释写明允许同课；picker 的 `isRowBlockedByDropSameSection` 对重修直接跳过。

## Decisions

1. **CORE 名额**：在选课器展平/行构建时，对 `type===CORE`（或 sourceType required）若走加课/重修 picker，将 capacity 规范为 5，remaining 按行稳定哈希落在 0～5；不改 `selectableCourses.js` 源数据，避免影响在线选课。
2. **补充说明**：Retake / RetakeDrop 在 bottom fee 与声明之间渲染与加课相同的 `addNotes` textarea；详情在重修区块或费用后展示 `app.addNotes`（有值才显，与加课一致）。
3. **同课禁令**：新增 `hasSameCourseCodeOverlap(drop, retake)`（比课号，不分分组）。RetakeDrop 提交失败；重修选课器对与 `dropLines` 同课号行禁用，名额列用 tip。反转旧「重修允许同课」口径。
4. **文案**：沿用「补充说明」；新增同课禁令 i18n key。

## Risks

- 仅 picker 覆盖 CORE 容量时，审批明细若直接读课库原容量可能仍显示大数 → 审批已选行用申请快照数字，一般无妨；若审批汇总从课库重算，另议。
