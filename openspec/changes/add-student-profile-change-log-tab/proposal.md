## Why

学生基本信息与住宿信息后续由学工系统维护、教务只读；教务详情需展示这些字段在学工侧的变更对比（从什么→什么、字段、时间、谁改的），与现有「状态日志」（学籍状态）区分开。

## What Changes

- 学生详情抽屉在「状态日志」右侧新增 Tab：**信息变更记录**
- 展示 `basicInfo` / `accommodation` 字段级变更流水（mock，模拟学工同步）
- 每行包含：变更时间、所属分区、字段、原值、新值、变更人、角色（老师/学生）
- 本阶段仅详情只读；不改编辑表单 Tab，不接真实学工 API

## Non-goals

- 不覆盖学籍（enrollment）字段，也不替代状态日志
- 不记录 contact / family / education / others（后续可扩展）
- 不在本教务系统内写回这些字段

## Capabilities

### New Capabilities

- `student-profile-change-log`：学生详情信息变更记录 Tab 与 mock 数据

### Modified Capabilities

（无）

## Impact

- `studentDetailTabs`、`StudentProfileDetailDrawer.vue`
- 新组件 `ProfileChangeLogTab.vue`
- `students.js`：`profileChangeLogs` 结构 + 种子数据
- i18n：Tab 名与表头
