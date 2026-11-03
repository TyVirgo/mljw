## Why

重修含退课打开选课弹框时 `action` 被映射为 `Retake`，导致同课同分组禁用未生效，名额列仍显示可选名额；直到提交才报「不能退课后重修同一门课的相同课程分组」。

## What Changes

- 选课器在 `Retake` 且存在拟退课行时，同样按同课同分组禁用并在名额列提示（与提交校验一致）
- 同课同分组比对优先课号 + 分组码，避免退课行与重修课库 sectionId 不一致漏拦

## Capabilities

### New Capabilities

- `adddrop-retake-picker-same-section-block`: 重修弹框提前禁用同课同分组

## Impact

- `AddDropCoursePickerModal.vue`、`addDropFormSections.js`（match key）
