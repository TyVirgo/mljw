## Why

学生选课监控顶部统计仍是「应参与 / 已参与 / 平均学分」，无法一眼看到各维度完成度风险人数；工具栏与行操作仍挂白名单入口；详情标题与学生信息表重复；缺少发送提醒次数记录。

## What Changes

- 顶部统计改为 5 张卡：GE 毕业 / GE 学期 / ME 毕业 / ME 学期 / 必修课完成度 **低于 50%** 的人数（全量队列，首版不可点筛）。
- 去掉工具栏「查看白名单」与行操作「加入白名单 / 已在名单中」。
- 详情抽屉标题固定为「选课监控详情」，去掉姓名/副标题（学生信息表保留）。
- 操作列前新增「发送提醒次数」列，与操作列双右冻结；确认发送后累计 +1；适当收紧列宽以减少横滑。

## Non-goals

- 统计卡首版不联动筛选、不点击下钻。
- 不改侧栏白名单菜单与白名单页本身。
- 不改详情抽屉学分条/课表结构。

## Capabilities

### New Capabilities

- `monitor-risk-stats-remind`: 监控风险统计卡、提醒次数列、白名单入口清理、详情标题

### Modified Capabilities

- （无）

## Impact

- `RegistrationMonitorView.vue`、`RegistrationMonitorDetailDrawer.vue`
- `registrationMonitorQueue.js`、`monitorCreditInsights.js`（统计）
- 导出字段与 i18n
