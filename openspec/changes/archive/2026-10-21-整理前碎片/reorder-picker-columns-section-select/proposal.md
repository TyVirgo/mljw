## Why

白名单选课与加退课选课弹框中，课级合并列与分组分行列交错，阅读成本高；未来学期必修/换组虽存分组 ref，勾选仍按整课一键全选，无法只选同课部分分组。

## What Changes

- 白名单选课弹框：学分列与课程分组列互换（学分靠前）
- 加退课选课弹框（必修/GE/ME）：一级合并字段靠前、二级分行字段靠后重排
- `selectionUnit=section` 时多选框下沉到每个课程分组行；可只选同课部分分组；同步提示与计数文案

## Non-goals

- 不改先修豁免（`selectionUnit=course`）的按课号勾选语义
- 不改白名单 section ref 存储结构
- 不加退课弹框勾选粒度（已是分组行）

## Capabilities

### New Capabilities

- `picker-column-order-section-select`: 选课弹框列序与 section 级勾选

### Modified Capabilities

- （无）

## Impact

- `WhitelistCoursePickModal.vue`
- `AddDropCoursePickerModal.vue`
- `zh.js` / `en.js`（section 提示文案）
