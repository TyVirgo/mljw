## 两套 Cancel 并存

| 入口 | 条件 | 说明 |
|------|------|------|
| 学生列表 | In Progress + Pending Review + 未开始审批 | 保留 add-*-app |
| 管理列表 | In Progress | 本次新增 |

## 组件

```
MovementAdminCancelAction.vue
  props: sourceKey, item (raw)
  canAdminCancelMovement(item) → status === 'In Progress'
  点击 → ConfirmDialog → adminCancelMovement → upsertInStore

movementApplicationCancel.js
  canAdminCancelMovement / adminCancelMovement / applyAdminCancelInStore
  actor 默认 'AC'；log comment 区分 student / AC
```

Cancel 仅出现在管理端列表 Actions，不在详情抽屉 Footer。
