## Why

缴费名单管理点「导出」会直接下载双 Sheet Excel，无字段选择与范围控制，与刚落地的选课结果导出弹框不一致，教务无法按明细/汇总或勾选学生导出。

## What Changes

- 缴费名单导出改为复用 `ExportModal`：字段穿梭 + 当前页/全部/已选行。
- 导出类型「明细」（默认，学生×课）/「汇总」（学生一行），与选课结果第一轮同款。
- 主表增加勾选列以支持「导出选中行」；明细时展开所选学生的课程行。
- 不再默认一次导出双 Sheet。

## Non-goals

- 不改「查看课程」抽屉内导出。
- 不改缴费业务规则、导入已缴名单。
- 不新增后端接口。

## Capabilities

### New Capabilities

- `fee-roster-export-modal`: 缴费名单 ExportModal 明细/汇总导出

### Modified Capabilities

- （无）

## Impact

- `FeeRosterView.vue`
- 复用 `ExportModal`、`feeRosterStudent/CourseExportFields`、format 行函数
- i18n 可复用 `result.exportDetail` / `exportSummary` 或 feeRoster 文案
