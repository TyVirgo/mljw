## Why

重修专选弹框对「ME选课」虚拟大组仍展示课程组列与底色，与在线 ME（仅 n 选 m 有课程组/蓝黄底）不一致；原课 demo 挂科行过多，未清晰对应四类。

## What Changes

- ME选课（虚拟大组）行：不展示课程组列（或该批全为 ME选课时隐藏列）、不挂蓝黄底色。
- 4选3 / 3选2 / 2选1：保持课程组列与在线一致的交替底色。
- 原课 demo 不及格专选仅保留四类各一例：4选3、3选2、2选1、ME选课。

## Non-goals

- 不改在线选课主表（StudentRegisterView）结构。
- 不改组内及格禁选规则。

## Capabilities

### New Capabilities

- `adddrop-me-retake-group-ui-demo`: ME选课无组列无底色与四类 demo

### Modified Capabilities

- （无）

## Impact

- `AddDropCoursePickerModal.vue`、`retakeSubstitutePool.js`（导出常量复用）、`studentTranscript.js`
