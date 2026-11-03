# 变更：polish-session-academic-month-picker

## Why

选课时间配置「新增」时学年学期使用固定下拉，无法灵活选任意年月。产品要求改为年月选择（不到日），展示仍为 `2026/09`，并提供 2/4/9 学期起月快捷，同时可自定义月份。

## What Changes

- **新增学年学期**：去掉下拉，改用年月选择器；值格式 `YYYY/MM`。
- **快捷**：当前年（或已选年）的 02 / 04 / 09。
- **自定义**：年月面板可选任意月；复用并扩展 `DatePickerEn` 支持 `yyyy/mm`。
- **增量**：学期起月快捷 MUST 位于年月 popover 内（标题与月份格之间），MUST NOT 再占输入框上方；中文界面月份格 MUST 用「一月…十二月」。
- **修改态**：学年学期仍只读展示。
- **唯一性**：保存时仍校验同学期不可重复。

## Non-goals

- 不改批次表单等其它学年学期下拉（除非同源复用）
- 不强制只能选 2/4/9

## Capabilities

### New Capabilities

- `session-academic-month-picker`：选课时间配置新增学年学期的年月选择

### Modified Capabilities

- （无主库条目）

## Impact

- `DatePickerEn.vue`、`universityInfo.js`（可选 yyyy/mm）
- `AcademicSessionMonthPicker.vue`（新建）
- `SessionScheduleEditDrawer.vue`
- i18n；OpenSpec 本 change
