## Context

审批弹窗 `AddDropApprovalModal` 中「常用意见」列表用 `position: absolute` 向上展开，父级 `.modal-body` 为 `overflow-y: auto`，导致首条文案顶部被裁切。超出学分列在审批/学生列表共用 `listExcessCredits`，空值返回「—」，中文表头带「（分）」。历史表 `.data-table--sticky` 设 `min-width: 1400px`，强制横滑。

## Goals / Non-Goals

**Goals:**

- 常用意见每条文案完整可见
- 表头「超出学分」；无超出学分数据时显示 `0`（含 Drop / 无字段）
- 收紧列宽，常见桌面宽度尽量无需横滑

**Non-Goals:**

- 不改预设文案内容、不改学分计算
- 不引入 Ant Design Dropdown；保持原生按钮列表
- 不保证超窄屏零横滑（操作列多按钮时仍可局部横滑）

## Decisions

1. **常用意见弹层**：优先在 Comments 区域放开裁切——`comments` / `presets-wrap` 设 `overflow: visible`，`.preset-list` 提高 `z-index` 并保证首项完整 padding。若仍被 `.modal-body` 裁切，则将 preset 用 `Teleport` 挂到 `body` 并按按钮 `getBoundingClientRect` 定位。首版实现按「Comments 区 overflow + 必要时 Teleport」落地，以可见完整为验收。
2. **超出学分展示**：`listExcessCredits` 统一返回数字；`Drop` 或无数据 → `0`；有值 → `resolveAddDropExcessCredits` 结果。同步审批列表与学生申请列表。中文 `fieldExcessCredits` 改为「超出学分」；英文保持 `Excess credits`。
3. **表列宽**：去掉或显著下调 `.data-table--sticky` 的 `min-width: 1400px`；次要列（是否退课、超出学分、邮件次数等）收窄 padding/`min-width`；长表头允许换行；操作列保持内容自适应。目标是常见宽度下尽量一屏展示。

## Risks / Trade-offs

- [Teleport 定位] → 滚动/缩放时需关闭或重算；关闭弹窗时一并销毁
- [去掉 1400 下限] → 极多操作按钮行仍可能横滑；可接受
- [Drop 显示 0] → 与旧「—」语义不同；按产品「没有就为 0」统一

## Open Questions

- （无，Drop 按 0 落地）
