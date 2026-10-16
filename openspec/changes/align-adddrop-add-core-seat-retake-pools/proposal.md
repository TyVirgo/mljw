## Why

加课必修不应展示名额列；重修提升/不及格需按 ≥60 / &lt;60|缺考分流，三类课均有可选数据；课表必修不得无履历硬塞进重修池。

## What Changes

- 加课 + 必修 Tab：隐藏「可选名额/总名额」；重修含必修仍展示
- `mergeRetakePickerWithTimetableRequired` 按 retakeType 过滤，仅匹配成绩单
- 补 INT300 及格必修 demo（提升成绩 · 必修 Tab）

## Capabilities

### New Capabilities

- `adddrop-add-core-seat-retake-pools`: 加课必修名额与重修三池对齐

## Impact

- `AddDropCoursePickerModal`、`retakeSubstitutePool`、`studentTranscript`、`selectableCourses`、`StudentAddDropView`
