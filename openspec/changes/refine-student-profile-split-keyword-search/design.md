# 设计

## 搜索表单字段

| searchForm 键 | 数据字段 |
|--------------|---------|
| `studentId` | `item.studentId` |
| `studentName` | `item.name` |
| `chineseName` | `item.nameCn` |
| `icNo` | `item.icNo` / `basicInfo.icNo` |
| `mobilePhone` | `item.mobilePhone` / `contact.mobilePhone` |

## 筛选语义

```javascript
// 空值跳过；非空则 includes 模糊匹配；全部通过才保留
matchFuzzyField(value, keyword) // 对齐 movementApprovalQueue.matchText
```

多文本框与下拉筛选仍为 AND。

## 布局

```
第一行：[学号][学生姓名][中文名][身份证号][手机号]
       [专业][入学批次][学籍状态]                    [查询][重置][更多]
```

`flex-wrap` 自然换行；移除 `.search-item-keyword` 宽输入样式。

## 不改动

- 折叠高级筛选、表格列、导出、下拉筛选逻辑
- `keywordLabel` / `keywordPlaceholder` i18n 可保留（不再引用）
