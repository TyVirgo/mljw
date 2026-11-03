## Context

`retakeSubstitutePool` 已按 ME selectionGroups / GE 虚拟组拉替代课，但无「组内已及格课禁选」。原课列表挂科 ME 码多未入 n 选 m。操作列对齐已迭代多次，现要求整表居中。

## Goals / Non-Goals

**Goals:** 居中；不及格重修组内及格禁选；ME选课虚拟大组 + demo 对齐 4选3/3选2/2选1。

**Non-Goals:** 提升成绩禁选策略；加课逻辑。

## Decisions

1. **居中**：`.retake-original-table th, td { text-align: center }`（操作列一并居中）。
2. **禁选**：`retakeType===failed` 时，候选课自身最新成绩 `!isFailingGrade` → 全部分组 disabled + tip。
3. **ME选课虚拟组**：类似 GE，收纳未命中 selectionGroups 的本学期 ME 开课，组内互替。
4. **Demo**：成绩单补 4选3/2选1 挂科行；AI110 明确 ≥60；保证 SE201→AI110 禁 / WEB220 可选。

## Risks / Trade-offs

- [虚拟 ME 过大] → 仅本学期有开班的 ME，且排除已入 n 选 m 的码。
