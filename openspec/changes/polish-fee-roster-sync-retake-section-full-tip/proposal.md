## Why

审批通过后缴费名单未随学生端缴费状态变化；重修含退课误禁「同课号任意分组」导致合法换分组无法提交；选课器「已满」文案过短，与其它不可选原因风格不一致。

## What Changes

- 缴费名单：保留通过写入未缴；学生端支付成功后回写对应课行为已缴（恢复 `upsertFeeRosterFromPaymentLines`）
- RetakeDrop：仅禁止同课同分组；允许同课不同分组；名额列提示；纠正上一 change 的同课号禁令
- 名额列「已满」改为含剩余/总量的具体说明（带「不能选择」）

## Capabilities

### New Capabilities

- `fee-roster-sync-retake-section-full-tip`: 缴费名单回写 + 重修同分组禁令 + 已满文案

## Impact

- `feeRosterQueue.js`、`addDropFormSections.js`、`AddDropCoursePickerModal.vue`、i18n zh/en
