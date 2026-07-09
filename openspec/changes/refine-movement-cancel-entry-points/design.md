## 三套操作

| 操作 | 入口 | 文案 | 条件 |
|------|------|------|------|
| 学生取消 | 学籍异动申请（学生） | 取消 | Pending Review + 审批未开始 |
| AC 撤销 | 学籍异动申请（管理端） | 撤销 | In Progress（进行中/审批中） |
| AC 撤销 | 学籍异动维护 | 撤销 | In Progress |

## 组件

```
MovementStudentCancelAction.vue  — 学生申请列表「取消」+ tooltip
MovementAdminCancelAction.vue    — 管理端申请 + 维护列表「撤销」+ tooltip（两条，对齐原型）
```

**撤销 tooltip（管理端申请）**
1. AC 在「学籍异动申请（管理端）」列表对 In Progress（进行中/审批中）申请执行撤销。
2. 确认撤销后，申请流程被终止结束，通知流程的各个部门该流程已终止。

维护页第一条改为「学籍异动维护」列表，第二条相同。

四类 `*View.vue` 按 `applicantMode` 二选一展示上述组件；Query / Approval 不引用 Admin Cancel。
