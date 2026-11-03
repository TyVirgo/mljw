## Why

选课时间 / 选课批次 / 选课结果（课程维）搜索条件过少且右侧留白；需按表列适当扩充，并在换行时提供收放。

## What Changes

- 选课时间：加启用状态筛；接入流式搜索样式。
- 选课批次：加类型 + 专业（专业进收起区）；流式 + 收放。
- 选课结果课程维：加课程类型，分组/学分进收起区 + 收放；学生维改为流式布局对齐。

## Non-goals

- 不引入我的课程的教师/起止周/星期筛。
- 不改表格业务逻辑与发布流程。

## Capabilities

### New Capabilities

- `cr-config-result-search-expand`: 配置与结果页搜索扩充

### Modified Capabilities

- （无）

## Impact

- `RegistrationScheduleView`、`RegistrationBatchView`、`RegistrationResultView`、`registrationResultByRound.js`、`preselectVolunteerConfirm.js`（可选筛字段）
