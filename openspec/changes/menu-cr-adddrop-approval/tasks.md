## 1. 文档整合

- [x] 1.1 按叶菜单合并
- [x] 1.2 全文中文
- [x] 1.3 旧包归档

## 2. 功能状态

- [x] 2.1 已落地（本包仅规格整理）

## 3. 审批弹框学分门控与表格（增量）

- [x] 3.1 课程表序号 + 尽量无横滑
- [x] 3.2 学分要求条 sticky 冻结
- [x] 3.3 行决策默认通过
- [x] 3.4 超 GE/ME 学期学分时确认左侧提示并置灰

## 4. 学分条 key 对齐与历史意见详情（增量）

- [x] 4.1 共用 `addDropApprovalLineKey`，学分条随通过/不通过/驳回动态更新
- [x] 4.2 详情操作列「意见详情」/ 无意见显示 —

## 5. 历史意见详情可见性（增量）

- [x] 5.1 操作列始终「意见详情」按钮；无意见弹层显示 —
- [x] 5.2 演示历史单补 `lineComment`；操作列加宽防裁切

## 6. 意见条件展示与列表重修学分列（增量）

- [x] 6.1 详情有评价意见才显示「意见详情」，否则「—」
- [x] 6.2 待审/历史主表超出学分=加课毕业超出；其后加重修学分列

## 7. 学分流水线回显与部分通过账单（增量）

- [x] 7.1 `ensureApplicationDetailCredits` 按行决策投影学分条（与审批弹框同源）
- [x] 7.2 `approve`/`reject` 写回 `termCreditStrip`；通过侧用 `approvedItems` 重建 `feeEstimate` 与账单字段
- [x] 7.3 详情费用与课程缴费仅含通过需缴费课；不通过/驳回不计

## 8. 预估 / 账单明细 / 学生缴费金额一致（增量）

- [x] 8.1 `getApplicationBillDetail` 以本单 `feeEstimate.items` 为课行真源
- [x] 8.2 `mergeLiveUnpaidFromApproval` 按申请 reconcile 待缴行，与预估课目金额一致

## 9. 修复缴费 reconcile 渲染死循环卡死（增量）

- [x] 9.1 `getApplicationBillDetail` 移除 seed/merge 调用
- [x] 9.2 merge 签名未变不写 `paymentLines`；打开账单时命令式 reconcile 一次

## 10. 账单三口径与缴完才落课（增量）

- [x] 10.1 账单明细合计与学生缴费课程/SST/应付一致
- [x] 10.2 有待缴时审批不落课；缴费成功后再落课并标记 scheduleApplied
