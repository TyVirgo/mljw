# 设计：polish-adddrop-demo-consistency

## Context

- 学生列表与审批列表共享 `addDropApprovalQueue`；演示学生申请由 `studentDemoSeed.syncDemoAddDropApplications` 注入。
- 本期申请类型代码已限定为 `Add | Drop | Retake | AddDrop`（`addDropTypeOptions`），但 demo 仍含 `Replace`。
- 学生端 `formatApplicationCourses` 直接拼接 `item.action`（英文）；审批端 `summarizeItems` 已用 `typeLabel`（i18n）。
- `baseStudent.currentCredits` 取自已确认选课学分总和，易导致演示生所有单据同为超限学分。

## Goals / Non-Goals

**Goals**

- Demo 与「本期四种类型」口径一致。
- 费用、账单、学分、时间线可讲通故事。
- 学生/审批两端课程摘要语言一致。

**Non-Goals**

- 不新增列、不改审批抽屉交互、不接真实财务。

## Decisions

1. **删除 Replace demo，不改类型枚举**  
   - 理由：表单与 `addDropTypeOptions` 已不含 Replace；列表残留会造成「能看不能建」。  
   - 若需「换课」故事，用 `AddDrop`（先 Drop 后 Add）表达。

2. **学生列表课程摘要复用审批端同一套 typeLabel**  
   - 在 `StudentAddDropView` 的 `formatApplicationCourses` 中对 `item.action` 走 `courseRegistration.approval.type.*`。  
   - 分隔符与审批端对齐（` · `）。

3. **按申请单校正 currentCredits，而非一律灌入已选总分**  
   - `buildDemoAddDropApplications(credits, …)` 仍接收总分，但各条可覆盖 `currentCredits`：  
     - 正常样本：12～18；  
     - 超限样本：仅 1～2 条 Add/AddDrop 使用 ≥ creditMax+ 的值（如 22 或 29）。  
   - 管理端 `initialQueue` 非演示生条目保持合理学分；与演示生合并后待审批不再刷屏。

4. **账单与 fee 对齐规则（demo）**  
   - `fee > 0` 且未结清 → `billStatus: 'pending'`（或已通过且已缴 → `paid`）。  
   - 纯 Drop、无费 → `billStatus: 'none'`。  
   - Retake：至少一条 `fee > 0` + `pending`，体现重修缴费口径。

5. **时间线**  
   - 提交时间使用活动批次窗口内日期（当前默认窗约 `01-Jul-2026`～`31-Aug-2026`），格式统一为 `YYYY-MM-DD HH:mm`（与学生列表现有一致）。  
   - `addDropApprovalQueue` 初始数据中 `10-Sep-2025` 类英文日格式改为同一格式，或统一为批次常用 `DD-Mon-YYYY HH:mm`——**选定：`YYYY-MM-DD HH:mm`**，与学生端一致，改队列初始数据。

## Risks / Trade-offs

- 改提交日期后，与「2025 学年」叙事可能略脱节 → 学年学期字段仍用 `2026/04`，仅提交时刻落在演示窗内，可接受。  
- 超限样本变少 → 审批「超学分」场景仍保留 1～2 条即可演示。

## Migration Plan

无持久化迁移；刷新页面后以新 seed 为准。

## 影响文件

| 文件 | 变更 |
|------|------|
| `src/data/courseRegistration/studentDemoSeed.js` | 去 Replace；学分/账单/时间/fee 校正 |
| `src/data/courseRegistration/addDropApprovalQueue.js` | 初始队列日期格式、Retake/Add fee-bill 对齐 |
| `src/views/courseRegistration/student/StudentAddDropView.vue` | `formatApplicationCourses` 中文化 |
| i18n | 原则上不新增 key（复用已有 type.*） |
