## Decisions

1. `freshmanCapacityLabel` / `seniorCapacityLabel` 改为仅数字字符串（已选）；表头用新 i18n 键 `freshmanCapacityEnrolled` / `seniorCapacityEnrolled`（旧 WithRatio 键可弃用或改指向）。
2. 有效最大仍 `${enrolled}/${total}`。
3. 无排课 tip：结构为 `[提示] 文案`，样式对齐 `.cr-my-result-hint`。
