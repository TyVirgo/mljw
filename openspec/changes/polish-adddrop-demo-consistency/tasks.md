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

## 4. 收尾

- [x] 4.1 若有硬编码英文 action 的导出字段依赖，一并核对（无则跳过）
- [x] 4.2 本变更 tasks 全部勾选完成，可交给 `/opsx-apply` 复核或归档前自检
