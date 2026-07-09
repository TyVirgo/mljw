# 设计：多家长/监护人联系人

## 数据模型

```
student.family[]  ──选学生──▶  parentContacts[]  (申请快照)
                                    │
                                    ├── 表单可增删改
                                    └── withSyncedLegacyParentFields → parentGuardianName 等 (首条)
```

## 字段映射

| family | parentContacts |
|--------|----------------|
| name | name |
| relationship | relationship |
| icPassport | icPassport |
| mobilePhone | mobilePhone |
| email | email |

## 校验

- **deferment**：至少一条非空联系人；每条 name + mobilePhone 必填
- **withdrawal**：同上 + icPassport + relationship + email 必填

## UI

- **不新增视觉样式**：与改动前 Section III 单联系人表单/详情完全一致
- 编辑：`MovementParentConsentSection` — 对每个联系人重复原有 `form-grid`（姓名/关系/证件/电话/邮箱）
- 只读：`MovementParentConsentReadonly` — 对每个联系人重复原有 `detail-grid`
- 多位联系人之间增加轻量区分：序号标签（家长/监护人 1、2…）+ 顶部分割线；单联系人时不显示区分标志

## 兼容

`normalizeParentContacts` 优先读 `parentContacts[]`，否则从 flat 字段合成单条数组。
