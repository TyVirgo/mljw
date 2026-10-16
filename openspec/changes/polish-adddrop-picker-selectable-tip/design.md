## Decisions

1. **是否可选列**：`!isDrop` 时展示（加课 / 加退 / 重修）。文案：未禁用 →「是」；禁用 → `seatStatusTip` 优先，否则 `seatStatusLabel`。
2. **与名额列关系**：`showSeatOrRetakeColumn` 逻辑不变（加课必修仍隐藏名额）；两列可并存。
3. **重修 tip**：`isRetakeMode` 时展示 `pickerRetakeSubstituteTip`，Callout 样式同加课 tip。
4. **不改** 禁用判定本身，只提升可见性。
