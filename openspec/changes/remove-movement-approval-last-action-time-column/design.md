## 列顺序（移除后）

```
序号 | 状态 | 审批阶段 | [实施] | 学号 | 姓名 | 申请学期 | 生效学期 | 异动类别 | 申请次数 | 申请日期 | 操作
```

`[实施]` 仅历史 Tab 显示；待办 Tab 含勾选列。

## 清理

- 删除 `resolveLastApprovalActionTime` 及仅被其使用的 `APPROVER_ACTIONS` / `parseApprovalLogTimestamp`
- `tableColspan` 基数由 12 调整为 11
