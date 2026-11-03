## Why

专选不及格重修时，同课程组内已及格课仍可被选作重修目标；原课程表对齐不统一；ME 未入 n 选 m 的课组互替与 demo 行过少，难演示 4选3 / 3选2 / 2选1 / ME选课。

## What Changes

- 原课程表表头与单元格水平居中。
- 不及格重修弹框：同课程组内最新成绩已及格的课，其全部教学班不可选，原因「该课程已有成绩且及格」。
- ME：n 选 m 组保持；未入组的 ME 走「ME选课」虚拟大组互替；补强成绩单与本学期开课 demo，使各组在原课列表与弹框均可见足够行。

## Non-goals

- 不改加课 Tab、换组锁闸门算法。
- 提升成绩重修路径不强制套用本禁选（仅不及格重修）。

## Capabilities

### New Capabilities

- `adddrop-me-retake-group-pass-lock`: 专选组内及格禁选与 ME 虚拟大组 demo

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`、`AddDropCoursePickerModal.vue`、`StudentAddDropView.vue`
- `retakeSubstitutePool.js`、`studentTranscript.js`、i18n
