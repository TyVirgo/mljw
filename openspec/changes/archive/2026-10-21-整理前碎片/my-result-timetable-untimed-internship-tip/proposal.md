## Why

「我的课表」不展示无排课时段的实习必修课（如 INT300），学生易误以为漏课。需在课表抽屉底部补充提示：列表有行、课表无格、请联系老师确认安排。

## What Changes

- 「我的课程」课表抽屉 footer 左侧增加条件提示：当存在无上课时间的已选课时，列出课号/课名并说明不在课表展示、主表可见、请联系老师。
- 无此类课程时不显示该提示；关闭按钮仍在右侧。

## Non-goals

- 不把无时段课画进课表格子。
- 不改在线选课/加退选课表抽屉（除非后续需要）。

## Capabilities

### New Capabilities

- `my-result-untimed-tip`: 我的课表无排课实习提示

### Modified Capabilities

- （无）

## Impact

- `StudentMyResultView.vue` footer
- `studentMyResultCourses.js`（列出无时段课）
- i18n zh/en
