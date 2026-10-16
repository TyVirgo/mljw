## Why

学分情况 tip 文案需微调；学生加课/重修选必修时不应受名额限制（可超额申请，名额仅审批可见）。图示必修列仍显示「可选名额/总名额」与满员语义，应改为「是否可选」。

## What Changes

- `situationDeficit`：改为「…目前毕业累计未修学分为：必修课：…」
- 加课/重修「必修课」Tab：末列改为「是否可选」；可选显示绿色「是」，不可选显示原因
- 学生端必修行不再因名额已满禁用；公选/专选仍保留名额列与满员规则
- 审批侧名额列不变

## Non-goals

- 不改审批弹窗名额展示
- 不取消换组锁、冲突、学分帽等其它不可选原因

## Capabilities

### New Capabilities

- `adddrop-core-selectable-no-seat-cap`: 必修是否可选列 + 学生无名额拦

### Modified Capabilities

- （无）

## Impact

- `AddDropCoursePickerModal.vue`
- i18n zh/en（tip + 列头/是）
