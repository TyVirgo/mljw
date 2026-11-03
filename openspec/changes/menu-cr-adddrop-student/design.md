## 背景

整合历史增量，仅保留当前应然行为。

## 目标 / 非目标

**目标：**

学生端加退课主流程

**非目标：**

不重做整页原型

## 决策

1. 以当前代码为真源
2. 全中文
3. 历史包见 SOURCES.md
4. 退课学分摘要：共用 i18n `coursePickerSelectedDropCredits`；数字口径与弹窗一致（退课前=学期基线总分，退课学分=拟退行合计，还剩=前−退）；申请表传入 `termCreditStripBaseline`
5. 样式：无选中灰字；有选中整句红字 `#dc2626`
6. 课程表明细首列序号（1-based）；`lines-table-wrap` 保持 `overflow-x: hidden` + `table-layout: fixed`，时间地点多行折行，避免横滑
7. 重修公共区顺序：学分费用行 → 费用预估框 → 重修补充说明
8. 详情重修表「同课号重修」列：与表单 `resolveRetakeStudyModeKey` + `studyModeLabel` 同源
9. 学分条投影：`buildAddDropTermCreditStrip` 对加/退/重修行统一 `enrichCourseForCreditStrip`；重修选课器在 locked 原课池下投影时，保留本弹窗课表匹配不到的表单已选重修行（跨 Tab 一致）
10. 学生详情学分/费用：与审批队列同一申请对象；展示走 `ensureApplicationDetailCredits` / 审结后的 `feeEstimate`，与历史详情一致
11. 课程缴费整单：与审批后 `feeEstimate` 课目/金额 reconcile，不混入其它申请或 0 元加课
12. 学生申请列表：`status` 后增 `bill`，文案与审批历史 `billStatus` 同源
13. 二次申请门控：存在未审真实提交单，或已通过/部分通过且 `billStatus=pending` 有应付 → 不可提交。未审与待缴判断均须 `isStudentSubmittedAddDropApplication`（`adr-stu-`），demo 种子不计入「第一次/二次」
14. **开窗体验：** 「发起申请」在窗口期内可打开表单；若未审或待缴门控触发，窗内提示原因且 `formOpsDisabled`，提交按钮禁用（不拦在门外）
15. **学分一致：** 当前生审结且已落课/已付款/已拒绝的详情学分条，与二次申请顶栏均使用课表确认态快照（`buildLiveConfirmedTermCreditStrip`）；有应付未缴详情仍可用行决策投影预览
16. **重修单课互斥：** 重修选课器（`failed` / `improve_grade`）勾选一门后，其余行置灰；取消勾选后恢复。加课仍允许同组多课。实现：`isRowDisabledBySibling` + `pickRow` 重修分支；表头全选在重修模式禁用
