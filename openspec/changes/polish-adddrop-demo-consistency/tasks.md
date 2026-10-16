# 任务：polish-adddrop-demo-consistency

## 1. Demo 数据校正

- [x] 1.1 在 `studentDemoSeed.js` 的 `buildDemoAddDropApplications` 中删除 `type: 'Replace'` 条目；原「换课」叙事改为保留/强化 `AddDrop` 样本
- [x] 1.2 按单覆盖 `currentCredits`：多数 12～18；最多 2 条超限（Add 或 AddDrop）；避免全部等于已选学分总和
- [x] 1.3 对齐 fee 与 `billStatus`/`billAmount`：有费 → pending 或 paid；重修至少一条 pending 且 fee>0；纯 Drop 保持 none
- [x] 1.4 将演示单 `submittedAt` 调整到活动批次 `addDropWindow` 内，格式统一 `YYYY-MM-DD HH:mm`

## 2. 审批队列初始数据

- [x] 2.1 校正 `addDropApprovalQueue.js` 初始队列：日期格式统一；Retake/Add 的 fee-bill 不一致项修复
- [x] 2.2 确认与 seed 合并后，待审批列表无 Replace，且演示生超限不刷屏

## 3. 学生列表展示

- [x] 3.1 修改 `StudentAddDropView.vue` 的 `formatApplicationCourses`，动作文案走 `courseRegistration.approval.type.*`，分隔符与审批端一致
- [x] 3.2 目视确认：学生列表无「替换」、课程摘要为中文类型、窗口文案与提交时间不矛盾；审批端账单/学分故事可读

## 4. 退课原因与毕业计费费用（续）

- [x] 4.1 seed / 审批队列：含退课的申请补全非空 `dropReason`（可同步 `reason`）
- [x] 4.2 enrich：`dropReason` 回落 `reason`；`billableCredits>0` 且无有效 `feeEstimate` 时按单价合成 feeEstimate（含 SST）
- [x] 4.3 校正「毕业超出>0 且费用为 0」样本（如 adr-001 / 同类 AddDrop），使详情预估费用与计费学分一致

## 5. 重修类型（续）

- [x] 5.1 seed / 审批队列：Retake/RetakeDrop 补全合法 retakeType；`improve`→`improve_grade`
- [x] 5.2 enrich：规范化别名；缺省按成绩兜底 failed / improve_grade

## 6. 学分条与毕业计费（真超额）

- [x] 6.1 `ensureApplicationDetailCredits` 支持 `termCreditStripBaseline`；items 带 type 参与投影
- [x] 6.2 adr-001（及同类真超额 AddDrop）抬高毕业 ME 基线，退 CORE + 加 ME，条上超额与 billableCredits/费用一致

## 7. 收尾

- [x] 7.1 若有硬编码英文 action 的导出字段依赖，一并核对（无则跳过）
- [x] 7.2 本变更续任务全部勾选完成
