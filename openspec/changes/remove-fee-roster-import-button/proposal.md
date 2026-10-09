## Why

缴费名单管理工具栏「导入」入口不再需要，避免误导操作。

## What Changes

- 去掉缴费名单页工具栏「导入」按钮及已缴费导入弹窗入口
- 保留导出

## Non-goals

- 不删除底层导入工具/弹窗源码（可后续清理）
- 不改列表字段与筛选

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `course-reg-fee-roster`：列表页去掉导入入口

## Impact

- `FeeRosterView.vue`
