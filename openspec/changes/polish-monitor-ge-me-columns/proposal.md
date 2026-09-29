## Why

学生选课监控主表把毕业选修 GE/ME 合成一列，统计卡又混入选修缺口与高/中严重，和「本学期 GE/ME」分层展示不一致，也不利于快速扫毕业进度。需要拆分毕业学分列、精简无关卡片，并补足 demo 分页数据。

## What Changes

- 主表「毕业学分（已选/要求）」拆为「GE毕业学分（已选/要求）」与「ME毕业学分（已选/要求）」，顺序与本学期 GE/ME 一致
- 去掉统计卡：选修缺口、高严重、中严重；保留应参与、已参与、平均毕业学分
- 去掉主表「严重程度」列（筛选区严重程度保留，便于按预警筛）
- Demo 学生行扩至 25 条；分页默认仍 20 条/页

## Non-goals

- 不改监控详情内 GE/ME 进度条结构
- 不删除预警类型筛选与发送提醒/白名单操作
- 不改平均毕业学分卡的合计均值口径（仍为 GE+ME 已修均值）

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `course-reg-monitor`：主表毕业学分分列、统计卡精简、去掉严重程度列、demo 行数

## Impact

- `RegistrationMonitorView.vue`、`monitorCreditInsights.js`、`registrationMonitorQueue.js`
- 导出字段 `courseRegistrationExportFields` / `formatMonitorExportRow`
- i18n `zh.js` / `en.js` 监控列表文案
