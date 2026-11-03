## Context

`DEMO_CONFIRMED_COURSES` 合并了 `DEMO_ADMIN_CONFIRMED_COURSES`（BUS201，1 学分）。总学分格用 `.is-total-cell` 青绿覆盖行色。退课 meta 键 `coursePickerSelectedDropCredits` 仅 count + drop 合计。

## Goals / Non-Goals

**Goals:** 确认课无 admin 代选 → 条上 29；总学分格同行色；退课文案含基线学期总与还剩。

**Non-Goals:** 不改其它模块 BUS201；不删 `includeAdmin` API。

## Decisions

1. **去 admin demo**：`DEMO_CONFIRMED_COURSES` 仅用轮次确认课；保留 `DEMO_ADMIN_*` 常量但注释弃用/不再并入（不删数组定义，避免其它引用断裂时难查）。
2. **配色**：删除 `.is-total-cell` 青绿规则，依赖已有 `.is-term-row` / `.is-grad-row`。
3. **文案**：`original = baseline.termTotal`（ge+me+mandatory 或显式 termTotalSelected）；`remain = max(0, original - dropSum)`；投影条仍为退后剩余，与 remain 对齐。

## Risks / Trade-offs

- [历史申请 demo 仍含 BUS201 Drop] → 可保留，与当前确认池无关  
- [无勾选时] → 仍显示「未选择课程」，不展示原来/还剩
