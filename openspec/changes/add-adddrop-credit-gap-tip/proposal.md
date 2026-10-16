## Why

加课/加退课申请需在「学分要求」条下用可读提示说明毕业未修学分（或已修满），审核详情同源可见；文案与条带列数据一致，不引入独立 programme study plan 口径。

## What Changes

- 学分要求条下方增加学分情况提示（带底色）
- 未修学分：由条带毕业 GE/ME「已选/要求」差额汇总；类型名用英文 GE / ME
- 均已修满：加课、加退课提示「均修满学分，无可选课程」
- 学生申请表与审批/详情学分要求区均展示；demo 默认展示缺学分态

## Non-goals

- 不改学分条七列结构与计算
- 不按培养方案独立接口重算（仅用当前 strip）
- 选课器内 strip 暂不挂此 tip

## Capabilities

### New Capabilities

- `adddrop-credit-gap-tip`: 学分要求下毕业未修/修满提示

### Modified Capabilities

- （无）

## Impact

- `addDropMultiItems.js`（tip 汇总）
- `AddDropTermCreditStrip` 或 FormSections / DetailBody / ApprovalModal
- i18n zh/en
