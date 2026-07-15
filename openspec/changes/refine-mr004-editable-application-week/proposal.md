# MR004 申请时间可编辑

## 背景
MR004 申请时间（5~7 周）当前只读展示，业务需支持管理端调整起止周。

## 变更内容
- 点击 MR004 行「编辑」时，申请时间列显示两个数字输入框，中间 `~` 固定
- 与规则值一并保存；校验 start ≥ 1 且 end ≥ start
- 规则名称 i18n 使用 `{start}`、`{end}` 动态插值

## 影响
- `movementRules.js`、`MovementRuleSettingsView.vue`、i18n
