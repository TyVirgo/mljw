## Why

学生申请详情与审批「审批」弹窗学分条口径不一致；未审申请未进入二次申请底账导致学分/课程对不上；同类型待审仍可再交。

## What Changes

- 审批弹窗学分条与学生/审批详情对齐：行决策为 pending 时仍按整单计入（仅 rejected / update_required 排除）。
- 二次申请底账 = 课表确认态 ⊕ **三类主类型全部未审申请**的加/退/重修行；学分条、拟退池、加课并入拟退等基于该底账。
- 使用未审估算底账时，学分情况 tip 区增加「！」说明估算性质。
- 同主类型（加课/退课/重修）存在 Pending/In Review 时：申请类型下红字提示，下方操作禁用、提交置灰；取消待审后可再发。

## Non-goals

- 不自动取消或合并多张待审单。
- 不改已通过申请写回课表的既有逻辑。

## Capabilities

### New Capabilities

- `adddrop-pending-ledger-approval-strip`: 未审底账 + 审批条对齐 + 同类型互斥 tip

### Modified Capabilities

- （无）

## Impact

- `addDropMultiItems.js` / `addDropApprovalQueue.js`
- `AddDropApprovalModal.vue`
- `StudentAddDropView.vue` / `AddDropApplicationFormSections.vue` / `AddDropTermCreditStrip.vue`
- i18n zh/en
