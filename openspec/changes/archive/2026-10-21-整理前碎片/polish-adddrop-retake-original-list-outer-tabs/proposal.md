## Why

重修原课程列表信息过密、操作列易被裁切；学年学期与成绩分列难读多学期历史；类别 Tab 仍在选课弹框内，与「先定原课再进弹框」的两层流程不一致。

## What Changes

- 退课四学分只读字段改为 1 行 4 列（`.fields-row-4`）。
- 原课程区标题随重修类型：`failed` →「不及格课程 *」；`improve_grade` →「允许重修课程 *」（两侧均带必填星）。
- 原课程表：合并「学年学期/成绩」多行展示（最新在上，格式 `YYYY/MM：成绩`）；最新成绩 ≥60（含 60）属提升池，否则属不及格池；前列增加「课程类型」；加宽操作列避免遮蔽「选择重修课程」。
- 重修类型下拉仍分不及格/提升池：选中一种只展示该池原课。
- 必修/公选/专选 Tab 从重修选课弹框移到原课程表外侧；外层切换类别才过滤原课列表；进入重修弹框后无类别 Tab，按原课类型自动展示候选。
- **加课选课弹框类别 Tab 不变。**

## Non-goals

- 不改加课弹框 Tab/筛选逻辑。
- 不改重修匹配/替代课算法与 `isFailingGrade` 门槛（仍为 score &lt; 60）。
- 不改费用估算规则。

## Capabilities

### New Capabilities

- `adddrop-retake-original-list-outer-tabs`: 原课程列表展示、外层类别 Tab、重修弹框去 Tab

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`、`AddDropCoursePickerModal.vue`、`StudentAddDropView.vue`（若需传锁定类别）、`studentTranscript.js`（多行成绩文案）、i18n zh/en
