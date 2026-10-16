## Context

学分要求条已展示毕业 GE/ME 已选/要求等。需在条下按条内数字汇总提示；文案固定含英文 `programme study plan`；加课与加退课均提示。

## Goals / Non-Goals

**Goals:**

- 条下 tip：缺学分 / 修满 两套固定中文（专名英文）
- 未修学分：GE/ME = 条上毕业列 max−current；必修 = 条数据 `gradMandatory`（同源基线，不增列）
- 凡有学分要求条的加/退/重修/加退场景均显示 tip（含选课弹框）
- tip 随 strip 动态变（弹框勾选 → 重建 strip → 未修重算）
- demo 保持未满，默认见缺学分文案

**Non-Goals:**

- 不改七列 UI

## Decisions

1. **汇总函数** `summarizeAddDropStripCreditGaps(strip)` → `{ mandatory, ge, me, hasDeficit }`。
2. **strip 扩展** `gradMandatory:{current,max}` 供 tip；七列不渲染。
3. **展示**：`shouldShowAddDropCreditSituationTip` 覆盖 `Add|Drop|Retake|AddDrop|RetakeDrop`；选课器传 `:application-type="action"`；`showCreditProgress` 同步含 `RetakeDrop`。
4. **动态**：仅 `{mandatory}/{ge}/{me}` 随 strip 重算；两套固定 i18n 句式不改。
5. **样式**：条下 tip 盒，不改 strip 表格样式。

## Risks / Trade-offs

- [退课弹框也出「修满/无可选」句] → 与统一文案一致；有缺仍以缺学分句为主（demo 默认）
