## Why

学生选课监控主表学分列扁平，GE/ME 毕业与学期混排，缺少完成度与必修毕业进度，不利于按类扫读。

## What Changes

- 主表学分区改为双行表头三组：公共选修GE学分要求（4 列）、专业选修ME学分要求（4 列）、必修课学分要求（2 列）。
- GE/ME 二级：毕业已选/要求、毕业完成度、学期已选/要求、学期完成度。
- 必修二级：毕业已选/要求、毕业完成度（无学期列）。
- 完成度显示真实百分比（可 >100%）；要求为 0 时显示「—」。
- Demo/导出同步必修与完成度字段。
- 主表 compact：缩短二级表头、收紧字号/内边距、组间分割线；窄屏可横滑但操作列右冻结。
- 筛选：入学批次下拉、姓名；状态/预警/严重程度改为 GE/ME/必修毕业完成度区间；已选/要求列胶囊色态。

## Non-goals

- 不改详情抽屉进度条结构。
- 不加必修学期列。

## Capabilities

### New Capabilities

- `monitor-credit-header-groups`: 监控主表学分分组表头与完成度

### Modified Capabilities

- （无）

## Impact

- `RegistrationMonitorView.vue`、`monitorCreditInsights.js`、`registrationMonitorQueue.js`
- 导出字段与 i18n
