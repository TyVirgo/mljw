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
- 编辑过程允许 `parentContacts` 为空数组；提交时由 `validateParentContacts` 拦截

## UI（编辑）

组件：`MovementParentConsentSection.vue`

```
┌─ Parent/Guardian N ────────── [🗑] ─┐
│  form-grid：姓名/关系/证件/电话/邮箱   │
└──────────────────────────────────────┘
（可 0..N 块；N≥2 时块之间顶部分割线）
[ + 添加家长/监护人 ]
```

- 每条有联系人时均显示标题行 + 垃圾桶（含仅 1 条）
- 删除：`emit('update:contacts', next)`，可删至 `[]`
- 添加：追加 `createEmptyParentContact()`
- 空态：无表单块；可选轻量提示文案 + 添加入口
- 不二次确认

## UI（只读）

- `MovementParentConsentReadonly`：按人数重复 `detail-grid`；多位时编号 + 分割线；无增删

## 兼容

`normalizeParentContacts` 优先读非空 `parentContacts[]`，否则从 flat 字段合成单条数组。
