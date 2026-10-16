## Why

百分制成绩需「分」单位；重修选课器必修 Tab 曾隐藏名额列，提升成绩/不及格重修均需与公选一致展示余量，不可选写明原因。

## What Changes

- 成绩展示：数字后加「分」（缺考不加）
- 重修选课器：必修 Tab 恢复「可选名额/总名额」列（冲突/满员/超学分等沿用现有单元格文案）

## Capabilities

### New Capabilities

- `adddrop-score-unit-retake-seats`: 分数单位与重修必修名额列

## Impact

- `studentTranscript.js`、`AddDropCoursePickerModal.vue`
