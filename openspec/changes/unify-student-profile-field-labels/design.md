# 设计
## 字段注册表

`studentProfileFieldDefs[fieldId] = { label, hint? }`

- `label`：英文 key，经 `tr()` 翻译（zh-flat / en 原文）
- `hint`：可选，详情与**表头**共用；搜索不使用

## 三处用法

| 位置 | API |
|------|-----|
| 表头 | `StudentProfileTableHeaderLabel` + Teleport tooltip |
| 搜索 | `fieldSearchLabel(id)` → 中文 `{label}：`，英文 `{label}:` |
| 详情 | `StudentFormField :label="labelKey(id)" :label-hint="hintKey(id)"` |

## Tooltip

表头 `?` hover 使用 `Teleport + fixed`（避免 `.table-wrap` 裁剪），文案与详情 `labelHint` 相同。

## Programme Level

zh-flat 中 `Programme Level` / `Programme Level:` 统一为「专业层次」。
