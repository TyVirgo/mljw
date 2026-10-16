## Context

志愿名单行已有 `preferenceRank`（1/2…），UI 未展示。学生维结果行有 `courseSource`，无志愿序。学生端另有「志愿次序」文案，本列产品名为「选课志愿」。

## Goals / Non-Goals

**Goals:**

- 名单：学期 → 选课志愿 → 志愿提交时间
- 学生维：课程来源 → 选课志愿 → 操作人…；仅第一轮有值
- 文案：第一志愿 / 第二志愿…
- 导出：R1 明细 + 学生维均含字段

**Non-Goals:**

- 不改 R1 课程融合主表列
- 不改 lottery 规则

## Decisions

1. **字段**：沿用 `preferenceRank`；展示用 `formatPreferenceRankLabel(rank, t)` → `courseRegistration.result.preferenceRankN` 或通用「第{n}志愿」/ 固定 1→第一志愿、2→第二志愿。
2. **学生维**：`courseSource === 'preselect'` 时展示 label，否则 `—`；demo 在 `buildStudentRegistrationResults` 为 preselect 行写入 `preferenceRank`。
3. **导出 key**：`preferenceRank`（导出单元格写已翻译文案或与列表一致的标签）。
4. **i18n**：表头 `courseRegistration.result.coursePreference` =「选课志愿」；`preferenceFirst`/`preferenceSecond` 或 `preferenceRankLabel` 带 n。

## Risks / Trade-offs

- [与「志愿次序」文案并存] → 表头固定用「选课志愿」，不复用 termSummary.preferenceOrder
