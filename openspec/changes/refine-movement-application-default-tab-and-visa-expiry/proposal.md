# 异动申请默认 Tab 与 Student Visa Expiry Date

## 背景
管理端/学生端进入学籍异动申请时应默认展示转专业；四异动新增申请表单 Section I 需统一展示 Student Visa Expiry Date，China/International 显示 IO 维护的日期范围，Local 显示占位符。

## 变更内容
- 异动申请壳层默认 Tab：`programme-transfer`（管理端与学生端）
- 四异动 FormModal Section I 增加只读 **Student Visa Expiry Date**
- China / International：展示 `studentPassExpiryStartDate - studentPassExpiryEndDate` 日期范围
- Local：字段可见，值为 `—`
- 详情 Modal、审批 `MovementDetailContent` 与表单一致
- 共享 `movementVisaExpiry.js` 工具；`movementCommon.fields.visaExpiry` i18n

## 影响
- `StudentMovementApplicationView.vue`
- 四异动 `*FormModal.vue`、`*DetailModal.vue`、`MovementDetailContent.vue`
- `programmeTransfers.js`、`deferments.js`、`resumptions.js`、`withdrawals.js` snapshot
- `restructure-student-records-navigation/design.md` 默认 Tab 修正
