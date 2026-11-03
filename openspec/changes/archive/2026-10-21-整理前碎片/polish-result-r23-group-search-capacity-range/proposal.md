## Why

选课结果 R2/R3 在对齐第一轮后出现「课程分组」列，与业务期望不符（ME/GE 均不需要该列）；结果页 CHS ME demo 未挂匹配课号的课程组，课程组列多为「—」；搜索缺少课程组与容量区间条件，不便核对。

## What Changes

- R2/R3：去掉「课程分组」列与搜索项；行模型改回一门课一行
- ME：保留「课程组」列；为结果页 CHS ME 批补齐 4选3 / 3选2 / 2选1 demo，pad 课按课号去 `-Dxx` 回退匹配
- 搜索：增加「课程组」文本条件；「有效最大容量（已选）」「新生容量已选」「老生容量已选」「特殊新加学生数量」各一对 min–max 区间（有效容量按已选分子）
- GE：无课程组列；课程组搜索无匹配时结果为空属预期

## Non-goals

- 不改 R1 志愿表「课程分组」列与志愿名单逻辑
- 不改老生容量只读弹窗
- 有效容量区间不筛分母（总量）

## Capabilities

### New Capabilities

- `result-r23-group-search-capacity-range`: R2/R3 去课程分组、课程组 demo/搜索与容量区间

### Modified Capabilities

- （无）

## Impact

- `RegistrationResultView.vue`
- `registrationResultByRound.js`
- `registrationBatches.js`（CHS ME selectionGroups）
- `zh.js` / `en.js`
