# 异动 Section I 字段调整

## 背景
退学「目前所在地」需改为下拉选项；四异动学生信息区需补充「目前所在学期」只读带出字段，并与「申请学年学期」同排展示。

## 变更内容
- 退学 `Current Whereabout`：下拉 `In Campus` / `Out of Campus`
- 四异动 Section I 新增 `Current Academic Session`（目前所在学期），格式 `YYYY/MM`，选学生后从 `enrollment.academicSession` 带出
- Section I **第 2 行**布局：左「目前所在学期」、右「申请学年学期」（表单、详情 Modal、详情抽屉一致）
- 转专业 Section I **第 3 行左**：补充只读「申请日期」（`dateOfApplication`），与其他异动一致
- Section I 统一展示 **Personal Email**、**Phone Number**（四异动）；**Accommodation Room Number**（仅休学/退学）；选学生后从档案带出，均非必填

## 影响
- `withdrawals.js`、`movementApplicationSession.js`、四异动 Form/Detail、`MovementDetailContent.vue`、i18n
