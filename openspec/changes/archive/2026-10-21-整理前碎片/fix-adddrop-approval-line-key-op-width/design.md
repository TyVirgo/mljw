## Decisions

1. `itemKey(item, idx) = \`${action}::${addDropLineKey(item)}\``；无 lineKey 时回退 `action::idx` 或 `idx`。
2. `col-op` / `op-cell` 加宽（约 26em+），表 `min-width` 略增；保持 `overflow: visible`。
3. 不修改 `addDropMultiItems.addDropLineKey` 导出语义。
