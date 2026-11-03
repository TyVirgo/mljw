## 1. Shared fee rebuild

- [x] 1.1 在 `addDropFeeRates.js` 增加从申请 items 重建 `feeEstimate`（Add 毕业超出 + Retake 全额，含 drop 释放）
- [x] 1.2 `resolveAddDropGradExcessCredits` 仅累计加课计费学分

## 2. Demo / detail display

- [x] 2.1 `addDropScheduleDemo` enrich 改用共享重建，去掉学期帽伪造单行
- [x] 2.2 表单「毕业超出」展示与 `resolveAddDropGradExcessCredits` 同源（仅加课）

## 3. Course payment

- [x] 3.1 `collectLiveUnpaidLines` 按 `feeEstimate.items` 拆行；兼容 AddRetake/AddDropRetake
