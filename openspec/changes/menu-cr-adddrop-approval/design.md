## 背景

整合历史增量，仅保留当前应然行为。

## 目标 / 非目标

**目标：**

审批工作台

**非目标：**

不推进已废弃半成品

## 决策

1. 以当前代码为真源
2. 全中文
3. 历史包见 SOURCES.md
4. 行决策初始化：无既有 `lineDecision` 时默认 `approved`（非 pending）
5. 学分条：沿用 `buildApprovalDecisionTermCreditStrip`；`rejected`/`update_required` 不计
6. 确认门控：学分条 GE/ME 学期 `tone === is-over` 则阻断；确认左侧提示超过哪些项（GE学期学分 / ME学期学分）
7. 学分条 `position: sticky` 钉在审批弹框可滚区域顶部
8. 课程表勾选后加序号列；收窄 `min-width` + 折行，避免横滑
9. 行决策 / 行意见 map 与学分条投影共用 `addDropApprovalLineKey(item, idx)`（`{action}::{courseId}::{sectionId}`），避免退/加同课同组撞 key 且保证 strip 能读到弹框决策
10. 历史/终态详情操作列：有非空 `lineComment` 才出「意见详情」；否则展示「—」
11. 审批列表（待审/历史）费用区列序：`excessCredits`（加课毕业超出计费）→ `retakeCredits`（重修全额计费学分）→ `fee` → `bill`…
12. **学分流水线：** 详情/列表回显统一走 `buildApprovalDecisionTermCreditStrip`（基线 ⊕ 计入行）。待审无决策=全量计入；审批中随行决策变；审结后仅 `approved` 计入。`ensureApplicationDetailCredits` 不得再用「全量 items」覆盖审结投影。
13. **审批写回：** `approve`/`reject` 持久化决策后的 `termCreditStrip`；通过/部分通过时用 `approvedItems` 重建 `feeEstimate` 与 `billAmount`/`excessCredits`/`retakeCredits`。
14. **部分通过账单：** 缴费名单与课程缴费仅含通过且应付的加/重修；不通过/驳回课不进 `feeEstimate.items` 与账单。
15. **账单金额真源：** 审批后 `feeEstimate`（及 `billAmount`/`sstAmount`）为唯一真源。历史「账单明细」按本单 `feeEstimate.items`（amount>0）生成课行，不得把同学号其它待缴/demo 行并进该单。学生缴费 `mergeLiveUnpaidFromApproval` 对本单待缴行做 reconcile（增/改/删），使整单课目与合计与预估一致。
16. **禁止渲染路径写缴费：** `getApplicationBillDetail` / 历史列剩余时间 MUST NOT 调用 `ensureStudentCoursePaymentSeeded` 或 `mergeLiveUnpaidFromApproval`。merge 仅在审批成功、进入课程缴费、显式打开账单等命令式入口调用；课目签名未变则 MUST NOT 赋值 `paymentLines`。
17. **账单合计三口径：** 明细待缴/已缴合计与学生结算同源：课程合计、SST合计、应付合计；SST 与学生课程缴费 demo 计税口径一致（含 SST=0 也写出）。
18. **有应付则缴完才落课：** `approve` 生成待缴账单时不 `confirm`/`drop` 课表；缴费成功（`billStatus=paid`）后再落课。无应付则审批结束立即落课。`scheduleApplied` 防重复。
