# Design: polish-adddrop-sst-and-admin-ui

## Decisions

1. **SST 税率**  
   Demo 固定 `SST_RATE = 0.06`（6%）。金额按分四舍五入到整数 RMB（与现有费用整数风格一致）。

2. **适用学生**  
   `!isLocalCategory(studentCategory)`，即 China / International；Local 恒为 0。`getStudentProfileFields` 透传 `studentCategory`。

3. **计费分层**  
   - `feeEstimate.total` = 超出学分费（不变）  
   - `feeEstimate.sstAmount` = SST  
   - `feeEstimate.payableTotal` = total + sst  
   - 提交 `billAmount` = payableTotal  

4. **UI**  
   加课/重修汇总行改为 4 列：总学分 | 超出学分 | 预估费用 | SST。详情同步展示 SST。

5. **批次字体**  
   `.batch-data-table` 相对时间设置再大两号：`font-size: 14px`（含操作链），`padding` 保持 `8px 10px`。

6. **监控**  
   仅移除搜索区 checkbox；`applyStatFilter('problem')` 仍可设 `problemsOnly: true`。

7. **详情是否退课**  
   `needDrop` 用 `common.yes` / `common.no` 文本，去掉 disabled radio。

8. **详情退课字段布局**  
   退课分节 `field-grid--after-table` 内学分/原因/附件去掉 `field-item--full`，统一两列网格排布。
