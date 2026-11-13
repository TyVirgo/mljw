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
6. 确认门控：GE/ME 学期是否超限按「已选 > 学期要求 + 因修未修」判定（与学生 `wouldExceedAddDropElectiveTermCap` / `sumGeMeTermStripExcess` 同源）；`summarizeApprovalStripCreditViolations(strip, catchUp)` 传入申请固定落下 tip。条上 `tone===is-over`（相对学期要求）仅着色，MUST NOT 单独阻断确认
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
19. **历史操作列：** 操作入口单行横排、文案不换行。列表按钮文案缩短：`发送邮件提醒`→「发送邮件」、`重新生成订单`→「生成订单」（英 Send email / Generate order）；弹窗标题等长文案键不变。`.action-links` / 按钮保持 `nowrap`，冻结列随短文案收缩，主表多露列。
20. **审批学分条冻结：** `modal-body` 改为上钉下滚（pin 学分条+蓝 tip，scroll 批量钮与课程表），禁止再用 body 内 sticky 导致操作钮透出。
21. **审批任课教师列：** 与详情一致加宽左移、少 ellipsis。
22. **审批取消存草稿：** 打开时对行决策/行意见做 baseline；取消仅当有改动才提示（文案对齐申请侧存草稿）；确认则 `saveAddDropApprovalDraft` 写回 items 的 `lineDecision`/`lineComment`（状态仍待审），再次打开 `initLineDecisions` 回显；不保存则丢弃本次改动关窗。
23. **落课与我的课表：** 无应付→审批结束即 `applyApprovedAddDropScheduleEffects`（仅通过行）；有应付→待缴不落课，缴费成功后再落课。落课须同步退必修池/确认池；「我的课表」仅在课表已生效（`scheduleApplied` / 已缴 / 无待缴）后反映通过的加/退/重修，样式为实线（不带申请预览虚线）。整页刷新 seed 恢复申请前默认课表。
24. **历史缴费剩余时间：** 单元格单行不换行。
25. **审批行决策实时学分 + 依赖门控（B）：** 点选通过/不通过/驳回时学分条 MUST 即时重算；若将退课改为不通过/驳回会导致仍通过的加课/重修超过「学期要求+因修未修」，则 MUST 禁止该次点选并提示老师（先处理加/重修行）。确认门控同口径拦终态超限。
26. **审批日志：** 加退详情时间线不展示行意见汇总 comment（如 `MATH101: aaa;…`）及蓝底；徽章按列表四态——已驳回用「已驳回」、已结束用「已结束」，不再用「已拒绝」。
27. **详情操作列胶囊：** 与学生详情同源，通过/不通过/驳回彩色胶囊。
28. **学分投影跟手（修复）：** 行 `type`/`sourceType`/学分 MUST 与课库合并后再投影（禁止「有脏 type 就跳过课库」导致退/加不计入学分）；`action` 大小写归一；提交行保留 `sourceType`。门控 B MUST 仅在相对上一决策**新引入或加重** GE/ME 超限时拦截，且拦截后 MUST 强制回滚 radio 与 map 一致，避免「点了不通过但条不动」。
29. **一行一列同步：** 学分分桶 MUST 与表头统一类别同源（`required`→必修，`GE*`→公共选修，`ME*`→专业选修）。点选一行 MUST 只影响该桶学期/毕业已选（及合计推导）；蓝 tip 仍固定。合理点选（含否必修退课、否加课/重修）MUST 直接变数无提示；仅「否退课导致仍通过的加/重修超学期要求+因修未修」为不合理并提示。
30. **门控 B 纯退课放行：** `validateApprovalLineDecisionsMap` 在「退课行由计入→不计入」且投影超限时，MUST 先判断拟议决策下是否仍存在计入学分条的加课/重修行；若无（纯退课单或加/重修均已否/驳），则 MUST 放行，学分矩阵按对应列回升。仅当仍有计入的加/重修时，才按「新引入/加重」超「学期+因修未修」拦截并回滚 radio。确认提交门控同口径拦终态。
31. **评价意见选填：** 行级评价意见入口保留；确认提交 MUST NOT 因不通过/驳回行意见为空而失败。有填写则照常写回 `lineComment` / 意见详情。
32. **确认门控因修未修（增量 an）：** 打开审批时学生已用因修未修顶满（如 GE 7/6 且落下 GE=1）属合理，MUST 可确定；仅老师否/驳等调整后学分未释放、终态仍超有效上限时才提示并置灰确定
33. **点选学分条跟手（增量 ap）：** 行决策 radio 用受控 `@click` 写 `lineDecisionsMap`（勿仅依赖易丢的原生 change）；成功应用后递增同步键；`liveTermCreditStrip` 显式依赖 map 各键值后 `buildApprovalDecisionTermCreditStrip`。退课否/驳→已选回升；加/重修否/驳→已选不加；通过→计入投影
34. **基线覆盖拟退（增量 aq）：** `buildApprovalDecisionTermCreditStrip` 在投影前对基线做 `ensureBaselineCoversDropItems`：必修/GE/ME（及毕业同源）已选 `max(原基线, Σ本单该桶全部退课学分)`，保证否/驳任一门退课时对应列已选必回升该课学分，不被触底吞掉
35. **否退超因修提示（增量 ar/as）：** 存在否/驳退课且任一桶已选 > 学期要求+因修未修时，footer 左下角提示影响加课/重修；行级 MUST NOT 禁选；条上可显示超限已选；蓝 tip 因修固定；要求分母仍为学期要求；提示出现时确认 MUST 置灰（as）
36. **操作/评价意见拆列（增量 ar/as）：** 审批弹窗、详情 body、重提弹窗：决策列仅 radio/胶囊；右侧独立「评价意见」列；保留两列并拉开间距；审批 radio 单行不折
37. **再审锁定（增量 ay，修订 av）：** `initLineDecisions` 时若行已有 `approved`/`rejected`，记入锁定集：radio/勾选批量/评价意见入口均禁用并置灰；`pending` 或无终态历史可改。审结写待缴时补 `billGeneratedAt`，live 缴费行同源携带
38. **锁定仅学生重提后（增量 az）：** 仅当 `approvalLog` 含学生 `Resubmitted` 时才对通过/不通过行上锁；老师草稿再开（无 Resubmitted）MUST 全可改
39. **再审 pending 默认上次驳回（增量 bb）：** 学生换课后行 `pending` 打开审批时 MUST 默认 `update_required`（上次老师驳回），MUST NOT 默认 `approved`；通过/不通过锁定规则不变
40. **不同意退课课表冲突（增量 bd）：** 仅 `rejected` 退课；用退课行时段 vs 仍计入学分条的加/重修（approved/pending）做 `getSectionMeetingsConflictInfo`；冲突 → footer 左下提示 + `confirmBlocked`；`update_required` 不触发
41. **审批弹窗附件材料（增量 bf）：** `AddDropApprovalModal` 滚动区课程表下增加只读「附件材料」节（对齐详情：预览/下载；无附件显示无）
42. **附件标题纯文案 + 课程预览（增量 bg）：** 附件节标题仅「附件材料」。底栏左「课程预览」：`buildAddDropApplicationSchedulePreview`，行投影与 `approvalDecisionCountsTowardCreditStrip` / 当前 `lineDecisionsMap` 同源
43. **预览置顶 + 冲突跟手（增量 bh）：** Drawer `elevate`/`overlayZIndex` ≥ 审批 overlay（≥1500）。`resolveLineDecisionFromMap` 在已有 decisions map 时 MUST NOT 回落 `item.lineDecision`；审批侧按 `itemKey` 快照决策再算冲突
44. **申请类型三色胶囊（增量 bi）：** 审批表 `申请类型` 列用 `type-tag` + `type-add`/`type-drop`/`type-retake`（蓝/红/黄），与详情同源
45. **已驳回文案 + 冲突话术侧（增量 bj）：** `lineUpdateRequired` / `approvalModal.action.updateRequired` →「已驳回」。`summarizeApprovalDropRejectScheduleConflicts` 传入锁定行：退课已锁则用加课/重修为问题点的 hint
46. **历史终止申请（增量 bo）：** 文案「终止申请」。`canAbort` 扩至 `Rejected`；终止后 `Cancelled`（关闭重提）。已通过待付终止逻辑不变
