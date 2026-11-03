## Why

选课监控目前只有单一学期数据，无法按选课学期切换查看该学期的风险统计与名单。

## What Changes

- 监控行增加 `academicSession`；提供多学期 demo（默认当前学期 + 至少两个历史学期，本学期指标有差异）
- 页面增加必选「选课学期」下拉；切换后统计卡、列表、导出均按该学期
- 其它筛选仍叠在当前学期池上；重置时学期回到默认，其它条件清空

## Non-goals

- 不提供「全部学期」混表
- 不改详情字段结构（仅数据随学期）
- 不改入学批次筛选项语义

## Capabilities

### New Capabilities

- `monitor-academic-session`: 选课监控按学期切换

### Modified Capabilities

- （无）

## Impact

- `registrationMonitorQueue.js`
- `RegistrationMonitorView.vue`
- 写入监控行的 demo/学生同步处：补默认学期或按学期查找（最小改动）
- `zh.js` / `en.js`
