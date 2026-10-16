## Why

学生/审批加退课申请详情仍展示「退课通道」（如特殊审批·第 N 周），产品已无此字段。明细表「课程类型」仍用旧三档文案（公共选修等），应与选课统一类别（必修课 / GE01–GE04 / ME01–ME04）对齐，并核对 demo。

## What Changes

- 申请详情基本信息区去掉「退课通道」展示（含教学周拼接）；`dropChannel` 数据可保留供业务逻辑。
- 详情 / 申请表单 / 审批弹窗课程明细「课程类型」取值改为 `formatUnifiedCourseCategoryLabel`（item ∪ 课库）。
- 扫加退 demo items，缺 `type` / `schoolElectiveCategory` 时补齐或确保可回落课库得到正确统一码。

## Non-goals

- 不删除自助退/特殊退业务字段与提交逻辑。
- 不改选课主表已统一的课程类别列。

## Capabilities

### New Capabilities

- `adddrop-detail-drop-channel-unify-type`: 详情去退课通道 + 课性统一类别

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationDetailBody.vue`
- `AddDropApplicationFormSections.vue`
- `AddDropApprovalModal.vue`
- `studentDemoSeed.js` / 相关审批 demo（按需）
