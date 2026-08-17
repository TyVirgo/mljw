## Why

名额分配弹窗仍把在册新老人数当可编辑项，且需手动点「按比例初分」；管理课程表新老容量列混杂「已选/容量」，阅读成本高。需收敛为只读在册人数 + 打开即初分 + 可二次改配额，表上只展示容量。

## What Changes

- 名额分配：在册新生/老生只读、一行两列；去掉「按比例初分」按钮，打开即按公式写入新老配额；新老配额一行两列可改，合计不得超过该分组有效最大容量。
- 多分组确认：按弹窗中新老比例落到各组自身有效容量（各组各自初分/按比例缩放）。
- 管理课程主表：有效最大容量、新生容量、老生容量仅展示容量数字；更新表头与 tip。

### Non-goals

- 不接真实在册人数接口（仍用 demo 在册口径）。
- 不改容量百分比设置流程本身。

## Capabilities

### Modified Capabilities

- `course-registration`：名额分配交互与管理课程容量列展示。

## Impact

- `BatchCourseQuotaAllocateModal.vue`、`BatchCoursesDrawer.vue`、i18n；可触及 `course-reg-batch` 需求包说明
