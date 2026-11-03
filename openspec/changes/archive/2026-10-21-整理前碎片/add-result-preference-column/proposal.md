## Why

选课结果需展示学生填报的「选课志愿」：课程维第一轮志愿名单缺少该列；学生维结果表在非第一轮来源也应明确显示「—」。

## What Changes

- 课程维·第一轮志愿结果名单：在「志愿提交时间」前新增「选课志愿」列
- 学生维·选课结果：在「课程来源」与「操作人」之间新增「选课志愿」；仅 `preselect`（第一轮选课）有值，其余为「—」
- 展示文案为「第一志愿」「第二志愿」等（非纯数字）
- 志愿名单明细导出、学生维导出均带上该字段

## Non-goals

- 不改抽签/录取逻辑
- 不改课程维第一轮主表（无志愿提交时间列的融合表）结构

## Capabilities

### New Capabilities

- `result-preference-column`: 选课结果选课志愿列（名单 + 学生维 + 导出）

### Modified Capabilities

- （无）

## Impact

- `PreselectVolunteerRosterDrawer.vue`
- `RegistrationResultView.vue`
- `registrationResult.js`、`courseRegistrationExportFields.js`、导出 format
- i18n zh/en
