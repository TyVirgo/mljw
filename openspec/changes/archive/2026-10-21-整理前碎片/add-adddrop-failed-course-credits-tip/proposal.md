## Why

申请表学分条仅提示毕业未修学分，看不到不及格课程学分结构；不及格原课表也无学分列，不便对照。

## What Changes

- 学分条「毕业累计未修」tip **下一行**增加：目前累计不及格课程学分（必修 / GE / ME），按不及格成绩单三池去重后学分求和（含 0 常显）
- 「不及格课程」三 Tab 共用表在「课程类型」前增加「学分」列

## Non-goals

- 不改毕业未修 tip 计算
- 不把提升成绩池计入不及格汇总
- 详情抽屉本变更可不强制同步

## Capabilities

### New Capabilities

- `adddrop-failed-course-credits-tip`: 不及格学分 tip + 原课表学分列

### Modified Capabilities

- （无）

## Impact

- `AddDropTermCreditStrip.vue`、`AddDropApplicationFormSections.vue`、`studentTranscript.js`、i18n
