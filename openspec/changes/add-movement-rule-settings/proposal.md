# 异动规则设置

## 背景
学籍异动需配置全局业务规则（Local / International / Chinese 转专业时限等）。本期新增固定规则表配置页，不提供新增与搜索。

## 变更内容
- 侧边栏「学籍异动」分组新增「异动规则设置」（位于知情同意书之后）
- 内置 3 条规则（图示业务要求），规则名称只读
- 可编辑：规则值（数字）、是否启用（YnSwitch 是/否）
- 规则值行内修改：修改 → 保存 / 取消；开关即时保存
- mock 持久化：`localStorage`

## 影响
- `movementRules.js`、`MovementRuleSettingsView.vue`
- `studentRecordsMenu.js`、`App.vue`、i18n

## 非目标
- 规则接入申请/审批校验逻辑
