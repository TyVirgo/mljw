# 设计

## 入口矩阵（变更后）

| 页面 | 撤销 |
|------|------|
| 申请（管理端） | ✗ |
| 维护 | ✗ |
| 审批 · 历史 Tab 列表行 | ✓（In Progress） |
| 审批 · 已提交/待我审批 | ✗ |
| 查询 | ✗ |

复用 `MovementAdminCancelAction` + `applyAdminCancelInStore`；`entryPoint: 'approval-history'`。

## 与「撤回」区分

- **撤销**：终止流程 → Cancelled（`movementAdminCancel`）
- **撤回**：撤回上一笔通过（`movementApproval.recall`，详情 footer，不变）
