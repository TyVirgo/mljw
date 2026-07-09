# 设计

## 内置规则

| id | 规则值含义 | 默认 |
|----|-----------|------|
| `MR001` | 长学期 Week 上限（短学期固定 Week 1，写在规则名称中） | 3 |
| `MR002` | 距下学期开学月数阈值（少于该月数仅能选下下学期） | 2 |
| `MR003` | 逾期是否仍允许提交（1=允许，0=不允许） | 1 |

## 数据

```javascript
{ id, ruleValue, enabled }  // 名称由 i18n movementRules.items.{id}.name 提供
```

`localStorage` key: `movement-rules-v1`

## UI

无搜索、无工具栏。表格列：序号 | 规则名称 | 规则值 | 是否启用 | 操作
