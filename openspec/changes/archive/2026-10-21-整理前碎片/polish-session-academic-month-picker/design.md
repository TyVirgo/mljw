# 设计：polish-session-academic-month-picker

## Context

- 新建：`SessionScheduleEditDrawer` + `select` + `createSessionOptions`
- 存储：`academicSession` = `YYYY/MM`
- `DatePickerEn mode=month` 默认 `mm/yyyy`

## Decisions

1. `DatePickerEn` 增加 `monthFormat: 'mm/yyyy' | 'yyyy/mm'`（默认保持 `mm/yyyy`）。
2. 新建 `AcademicSessionMonthPicker`：`v-model` 为 `YYYY/MM`；下方 `DatePickerEn mode=month month-format=yyyy/mm`，经 `monthPanelShortcuts` 在 popover 内提供 02/04/09 快捷。
3. 快捷年：与 popover 当前浏览年（`viewDate`）一致；切换年份后快捷同步。
4. `DatePickerEn` 在 `mode=month` 且界面为中文时，月份格展示「一月…十二月」。
5. 抽屉 create 态替换 select；edit 仍 disabled 展示。

## Risks

- 任选年月可能与旧 options 列表外值并存 → 保存唯一性校验已覆盖。
