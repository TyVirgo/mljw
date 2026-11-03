## Context

`AddDropCoursePickerModal` 当前：`showSeatOrRetakeColumn` 在加课必修 Tab 为 false；`showSelectableColumn` 在非退课模式为 true，用 `seatStatusTip` 填「是否可选」。选修名额列 `seatStatusLabel` 冲突/超学分仍用短文案。

## Goals / Non-Goals

**Goals:**

- 单一右侧状态列：「可选名额/总名额」
- 加课三 Tab + 重修均展示该列（退课仍不展示）
- 不可选单元格展示与原「是否可选」同源的详细 tip

**Non-Goals:**

- 不改禁用判定逻辑本身
- 不改审批明细表（已有名额数字列、无「是否可选」）
- 不删除重修顶部替换规则 Callout

## Decisions

1. **列可见性**：`showSeatOrRetakeColumn = !isDrop`；删除 `showSelectableColumn` 及相关 sticky CSS。
2. **单元格文案**：`seatStatusLabel` 在行禁用时优先 `seatStatusTip`（含 sibling 同课其他分组）；可选且有容量则 `remaining/total`。
3. **tip 措辞**：`pickerRetakeSubstituteTip` 改为核对「课程组 / 曾修成绩 / 可选名额」类表述。
4. **与旧 change**：行为以本 change 为准；旧提案文档不必回写。

## Risks / Trade-offs

- 长文案在窄列可能换行增多 → 保留 `title` 悬停全文；列宽沿用现有名额 sticky（约 14em）即可，必要时略加宽。
