## 1. 列表与导出

- [x] 1.1 `MovementApprovalView` 移除最近审核时间列
- [x] 1.2 导出字段与 `formatApprovalExportRow` 移除 `lastApprovalActionTime`

## 2. 数据层清理

- [x] 2.1 `movementApprovalQueue` 停止衍生 `lastApprovalActionTime`
- [x] 2.2 删除 `resolveLastApprovalActionTime`

## 3. 验证

- [x] 3.1 `npm run build`
