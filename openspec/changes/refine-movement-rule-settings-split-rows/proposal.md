# 异动规则拆分与动态名称

## 背景
原 MR001 将长/短学期 Week 上限合并为一行且写死在名称中；MR002/MR003 阈值数字亦与规则值重复。需拆行并用 `{value}` 动态展示规则值。

## 变更内容
- Local 转专业时限拆为 MR001（长学期）、MR002（短学期）两行
- 原 MR002/MR003 顺延为 MR003（国际）、MR004（中国）
- 规则名称 i18n 使用 `{value}` 插值，随规则值更新
- `localStorage` 升级为 `movement-rules-v2`，迁移 v1 数据

## 影响
- `movementRules.js`、`MovementRuleSettingsView.vue`、i18n
