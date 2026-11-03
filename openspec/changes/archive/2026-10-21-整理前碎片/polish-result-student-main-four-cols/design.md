## Context

`polish-result-student-detail-slim-table` 已将学生维主表收成：勾选、序号、学号、姓名、课号、课名、操作结果、详情；来源/志愿/操作人/时间仅在 `ResultStudentDetailDrawer`。业务需要在扫表时直接看到这四列，并将结果列文案改为「选课结果」。

## Goals / Non-Goals

**Goals:**

- 主表列序：勾选 | 序号 | 学号 | 姓名 | 课号 | 课名 | 课程来源 | 选课志愿 | 操作人 | 操作时间 | 选课结果 | 详情
- 结果列表头使用新键 `courseRegistration.result.selectionResult`（中文「选课结果」）
- 列宽自适应；长文本省略；右冻「选课结果 + 详情」；左冻学号/姓名保留
- 详情抽屉保留四字段；详情内结果标签同步用 `selectionResult`

**Non-Goals:**

- 不改搜索区 `log.resultLabel`（仍为「操作结果」）
- 不改数据模型与导出字段定义

## Decisions

1. **展示复用已有格式化函数**  
   - 来源：`feeCourseSourceLabel`  
   - 志愿：`formatStudentResultPreferenceLabel`  
   - 操作人：`formatStudentOperatorDisplay`（单行，过长 ellipsis + title）  
   - 操作时间：`row.operatedAt`  
   理由：与详情/导出语义一致，避免重复规则。

2. **文案用新键而非改 `log.resultLabel`**  
   搜索、日志等处仍说「操作结果」；仅学生维结果列/详情结果行改为「选课结果」。

3. **布局：`table-layout: auto` + 软约束**  
   去掉过死的全表 fixed；课名/操作人设 `max-width` + ellipsis；窄屏允许 `table-wrap` 横向滚动，宽屏尽量一屏内自适应。

4. **冻结策略不变**  
   左：学号、姓名；右：选课结果、详情。新增四列不参与冻结，避免右冻偏移复杂化。

## Risks / Trade-offs

- [窄屏横向滚动回潮] → 长列省略 + 仅冻两端关键列；不强制禁止滚动  
- [主表与详情字段重复] → 接受；详情仍作完整留痕（含原因/附件）

## 影响文件

- `src/views/courseRegistration/RegistrationResultView.vue`
- `src/components/courseRegistration/ResultStudentDetailDrawer.vue`（结果标签键）
- `src/i18n/locales/zh.js` / `en.js`
