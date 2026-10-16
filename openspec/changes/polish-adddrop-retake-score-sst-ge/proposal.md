## Why

重修曾修成绩需百分制；预估费用应含 SST；重修表缺课程类型；不及格重修公共选修无 GE 挂科 demo。

## What Changes

- 成绩单存/展示 0–100（60 及格）；曾修列与选课器同口径
- 表单/详情「预估费用」展示课程费+SST（payableTotal）
- 重修行表增加课程类型列
- 补 GE 挂科成绩单，使不及格重修·公共选修有可选课

## Capabilities

### New Capabilities

- `adddrop-retake-score-sst-ge`: 百分制、SST 合计、重修类型列、GE 挂科池

## Impact

- `studentTranscript.js`、`AddDropApplicationFormSections.vue`、`AddDropApplicationDetailBody.vue`、`AddDropCoursePickerModal.vue`
