## Why

加课选课器「公共选修 / 专业选修」Tab 缺少第三轮开放规则说明；产品仅需提示，不改变可选交互。

## What Changes

- 加课模式下，公共选修与专业选修 Tab 标签旁增加「？」tooltip。
- 文案说明：选修仅第三轮开放后可选择提交；开放前可见但置灰不可操作（本变更不实现置灰）；必修无此限制。
- 列表勾选与确认行为不变。

## Non-goals

- 不实现第三轮前选修置灰/禁选。
- 不给必修课 Tab 加该 tip。
- 重修 Tab 可不展示（仅加课）。

## Capabilities

### New Capabilities

- `adddrop-elective-tab-r3-tooltip`: 加课选修 Tab R3 说明 tip

### Modified Capabilities

- （无）

## Impact

- `AddDropCoursePickerModal.vue`
- i18n zh/en
