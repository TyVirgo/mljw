# 统一学籍异动声明区块

## 背景
休学、退学、复学、转专业四类异动的新增申请弹框须包含与转专业一致的学生 Declaration 声明区，便于合规确认；同时移除「下载家长同意书」按钮（家长信息字段保留）。

## 变更内容
- 四类型 FormModal 均含 section-bar + 条款列表 + 必填勾选（复学保留双勾选）
- 移除 Deferment / Withdrawal 的 `downloadParentConsent` 按钮及相关逻辑
- 休学新增 `declarationAgreed` 字段与 submit 校验
- 详情 / MovementDetailContent 同步展示声明区

## 影响
- `MovementDeclarationSection.vue`（新建）
- `*FormModal.vue` ×4、`MovementDetailContent.vue`、详情 Modal
- `deferments.js`、i18n
