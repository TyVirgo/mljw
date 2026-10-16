## Why

加课必修名额 demo 仍偏大（如 20/40）；重修表单缺少与加课对称的非必填补充说明；重修含退课仍允许「退同课号再重修同课号」（实习 INT300 最刺眼），与业务口径不符。

## What Changes

- 加退选课路径下 CORE 分组名额约 5（余量 0～5 轮换）；不改在线选课课库全局容量
- 重修 / 重修含退课：费用块与声明之间增加非必填「补充说明」（复用 `addNotes`）；详情与 demo 同步展示
- RetakeDrop：禁止拟退与拟重修课号重叠；选课器名额列详细原因 + 提交校验；修正/清理同课号 demo

## Capabilities

### New Capabilities

- `adddrop-core-seats-retake-notes-samecourse`: 必修小名额、重修说明、重修退同课禁令

## Impact

- `AddDropCoursePickerModal`、`addDropFormSections`、`AddDropApplicationFormSections`、`AddDropApplicationDetailBody`、i18n、demo seed / approval queue（若有同课样例）
