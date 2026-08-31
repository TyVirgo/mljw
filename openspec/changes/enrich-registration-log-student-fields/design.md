## Context

选课日志（`RegistrationLogView` + `registrationLog.js`）当前为操作审计事件流：成功/失败/排队等。行上仅有学号、姓名与课程信息，无专业、入学批次、是否重修。探索结论：不与「选课结果·学生维度」合并，仅增强日志。

## Goals / Non-Goals

**Goals**

- 日志行携带写录时学籍快照：`programme`、`intake`、`isRetake`
- 表格与 Excel 导出一致展示
- demo 数据可演示是/否重修

**Non-Goals**

- 合并结果学生维；新增筛选项；课程来源列；改写终态名单

## Decisions

1. **快照落在日志行**  
   `log()` 组装时写入 `programme` / `intake` / `isRetake`，不在打开页面时 join 当前学籍（审计语义）。

2. **列序**  
   批次 → 学号 → 姓名 → **专业** → **入学批次** → 课程 → 分组 → 学分 → 类型 → **是否重修** → 操作人 → 时间 → 排队 → 结果。

3. **展示**  
   - `intake`：`formatIntakeBatch`（与结果学生维一致）  
   - `isRetake`：是/否（`common.yes` / `common.no`）  
   - 失败/排队行亦可有 `isRetake`（表示操作意图）

4. **Demo**  
   扩展 `STUDENTS` 字典含 `programme`、`intake`；`log({ isRetake })` 默认 `false`，若干条置 `true`。

## Risks / Trade-offs

- 表宽增加 → 沿用现有横向滚动；不改 sticky 列逻辑  
- 未加筛选 → 若后续需要可再开增量

## Migration Plan

纯前端 demo；无持久化迁移。
