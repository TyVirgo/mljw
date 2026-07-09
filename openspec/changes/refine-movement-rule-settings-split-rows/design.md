# 设计

## 四条内置规则

| id | 默认 ruleValue | 含义 |
|----|----------------|------|
| MR001 | 3 | Local 长学期 Week 上限 |
| MR002 | 1 | Local 短学期 Week 上限 |
| MR003 | 2 | 国际生距下学期开学月数阈值 |
| MR004 | 1 | 中国生逾期是否仍允许提交（1/0） |

## 名称模板

`t('movementRules.items.{id}.name', { value: ruleValue })`

## v1 → v2 迁移

- 旧 MR001 → 新 MR001；新 MR002 默认 1、继承 enabled
- 旧 MR002 → 新 MR003；旧 MR003 → 新 MR004
