## 1. 审批表头

- [x] 1.1 调整 `AddDropApprovalView` 紧凑列 `min-width` / 去掉一字断行，表头最多约两行

## 2. 缴费名单卫生

- [x] 2.1 `collectLiveUnpaidLines` 写入姓名/专业/批次
- [x] 2.2 `upsertFeeRosterFromPaymentLines` 缺字段回填；既有脏行补全
- [x] 2.3 `aggregateFeeRosterStudents` 过滤无姓名行

## 3. 收尾

- [x] 3.1 勾选本 tasks
