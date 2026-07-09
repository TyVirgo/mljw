# 设计

## 布局

```
footer: [导出学籍卡]                    [关闭] [编辑]
         btn-outline (左)              btn-default / btn-primary (右)
```

`margin-right: auto` 将导出按钮推至左侧，右侧按钮组保持右对齐。

## 不改动

- 无 `@click`、无 toast、无 tooltip
- 不新增导出工具函数
