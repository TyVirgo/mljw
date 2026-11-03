## Why

选课监控主表在入学批次后缺少「本学期 GE+ME 已选学分合计」，教务需左右对照两组学期分子才能心算总负荷；增加「学期总学分」列可一眼看到本学期选修已选总量。

## What Changes

- 入学批次列后新增 **学期总学分**（`rowspan=2`）：值为本学期 GE 已选 + ME 已选（`getMonitorTermInsight` 的 `ge + me`），展示为数字，不含必修、不含「/要求」。
- 导出字段同步增加该列（紧跟入学批次）。

## Non-goals

- 不计入必修课学期学分。
- 不改 GE/ME 分组表头与完成度色阶规则。
- 不做筛选/排序按该列过滤。

## Capabilities

### New Capabilities

- `monitor-term-total-credits`: 监控主表与导出的学期总学分（GE+ME 已选之和）

### Modified Capabilities

- （无）

## Impact

- `RegistrationMonitorView.vue` 表头/表体
- `monitorCreditInsights.js` 格式化函数
- `courseRegistrationExportFields.js` / `formatMonitorExportRow`
- i18n zh/en
