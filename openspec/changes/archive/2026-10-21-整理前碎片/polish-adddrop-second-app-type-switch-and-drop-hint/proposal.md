## Why

同主类型有真实未审时，整表被锁但第一格 form-grid 整块仍可点，含「是否退课」等，不够专注；用户需要只切申请类型以改投另两类。退课主类型底部「进入审批队列」蓝条提示多余，应去掉。互斥继续按加课 / 退课 / 重修三类，不把加课·重修内的关联退课并进「退课」主类型。

## What Changes

- 二次申请互斥生效时：仅「申请类型」下拉可切换；同区「是否退课」及其余表单字段、选课操作仍不可改；提交仍置灰，切到未被挡主类型后恢复。
- 明确二次互斥按三种主类型（Add / Drop / Retake）计算；AddDrop 归 Add、RetakeDrop 归 Retake，与独立 Drop 互不串挡。
- 去掉退课主类型下的 `dropFormApprovalHint` 蓝条提示。

## Non-goals

- 不改主类型文案（加课（退课）等）与列表 demo 种子。
- 不改审批队列真正入队逻辑，仅去掉学生表单底部提示条。

## Capabilities

### New Capabilities

- `adddrop-second-app-type-switch-drop-hint`: 二次申请仅切类型 + 去掉退课审批提示条

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationFormSections.vue`（ops-disabled 精确到仅类型可点）
- `StudentAddDropView.vue`（移除 Drop 底部 callout）
- i18n：`dropFormApprovalHint` 可标记弃用或保留未引用
