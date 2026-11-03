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

6. **退课原因必填口径（demo）**  
   - 含 Drop 的申请：`dropReason` 非空；若仅有 `reason`，enrich 时 `dropReason = dropReason || reason`。  
   - 审批初始队列与 seed 手写补全（如「课程冲突」「个人兴趣调整」等可读文案）。

7. **毕业计费 ↔ 费用**  
   - `resolveAddDropGradExcessCredits > 0` ⇒ `feeEstimate.total > 0`（及 items / billableCredits）。  
   - enrich `reconcileExcessFeeBill`：在已有 billAmount 逻辑上，若 billable>0 且无有效 `feeEstimate.total`，则按 `billable × 500`（ME 默认 arts）合成 `feeEstimate`，本地生 SST=0，国际生按 `SST_RATE`。  
   - seed/队列显式样本尽量写全 `feeEstimate`，与 enrich 兜底双保险。

8. **重修类型（demo）**  
   - 合法值仅 `failed` | `improve_grade`（与 `RETAKE_TYPE_OPTIONS` 一致）。  
   - seed/审批队列手写补全；`improve` → `improve_grade`。  
   - enrich：对 Retake/RetakeDrop 规范化别名；仍缺省时按行成绩 F/M→`failed`，否则 `improve_grade`。

9. **学分条与毕业计费对齐（真超额）**  
   - 详情条 = `buildDemoTermCreditStripFromItems(items, termCreditStripBaseline)`；应用可带自定义 `termCreditStripBaseline`。  
   - items 须带 `type`/`sourceType`（退 CORE、加 ME 等），否则投影不移动。  
   - adr-001 叙事：基线 `gradMeCurrent=22`（学期 ME 仍 8/22）；退 COMP201（CORE）不减 ME；加 COMP3192（ME 4）→ 毕业 ME 26/24，`billableCredits=2`，费用 1000。  
   - 约束：条上毕业未超 ⇒ 计费 0；条上毕业超 ⇒ 计费 = 超额学分。

## Risks / Trade-offs

- 改提交日期后，与「2025 学年」叙事可能略脱节 → 学年学期字段仍用 `2026/04`，仅提交时刻落在演示窗内，可接受。  
- 超限样本变少 → 审批「超学分」场景仍保留 1～2 条即可演示。

## Migration Plan

无持久化迁移；刷新页面后以新 seed 为准。

## 影响文件

| 文件 | 变更 |
|------|------|
| `src/data/courseRegistration/studentDemoSeed.js` | 去 Replace；学分/账单/时间/fee 校正；dropReason；feeEstimate |
| `src/data/courseRegistration/addDropApprovalQueue.js` | 初始队列日期格式、Retake/Add fee-bill 对齐；dropReason；feeEstimate |
| `src/data/courseRegistration/addDropScheduleDemo.js` | enrich：dropReason 回落；billable>0 时合成 feeEstimate |
| `src/views/courseRegistration/student/StudentAddDropView.vue` | `formatApplicationCourses` 中文化 |
| i18n | 原则上不新增 key（复用已有 type.*） |
