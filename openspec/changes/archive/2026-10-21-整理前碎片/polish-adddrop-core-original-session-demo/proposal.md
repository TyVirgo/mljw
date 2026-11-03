## Why

加课「必修课」Tab 缺少「原上课学期」列，学生无法看到曾退/曾修学期；且加课必修 demo 与退课必修共用 MATH101，触发「不能退课后加回同一分组」提示，与「加课必修=以前退掉的课、退课=当前已选」语义矛盾。

## What Changes

- 加课选课弹框「必修课」Tab：在「可选名额/总名额」前增加「原上课学期」列，格式如 `2026/04`
- Demo：加课必修资格池与退课必修（课表已选）课程错开，不为同一门课；加课必修行默认可选，不因同课同分组误拦
- 同课同分组禁加回规则本身保留（真·加退同课同组仍禁）

## Non-goals

- 不改公选/专选加课列布局
- 不改重修选课器列
- 不删除同课同分组校验逻辑

## Capabilities

### New Capabilities

- `adddrop-core-original-session-demo`: 加课必修原上课学期列与加/退必修 demo 错开

### Modified Capabilities

- （无）

## Impact

- `AddDropCoursePickerModal.vue`、`addDropEligibleCourses.js`、`selectableCourses.js`
- i18n zh/en
- 可选：`polish-adddrop-selectall-approval-same-section` 场景说明仍适用真冲突
