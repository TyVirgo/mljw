# 设计
## 参考 UI（转专业）

```
SECTION III : DECLARATION BY THE STUDENT
┌──────────────────────────────┐
│ • item1                      │
│ • item2                      │
│ ☑ I agree to the declaration │
└──────────────────────────────┘
→ Documents（保留 Download Consent Letter，不含家长同意书下载）
```

## 各类型

| 类型 | 条款 | 勾选 | 移除家长下载 |
|------|------|------|-------------|
| 转专业 | item1+item2 | declarationAgreed | N/A |
| 休学 | 同转专业 | declarationAgreed（新增） | ✅ |
| 退学 | correct | declarationAccepted | ✅ |
| 复学 | correct+maxDuration | 两个 checkbox | N/A |

## 组件

`MovementDeclarationSection` 接收 sectionTitle、items[]、checkboxes[{field,labelKey?}]、form、errors。
