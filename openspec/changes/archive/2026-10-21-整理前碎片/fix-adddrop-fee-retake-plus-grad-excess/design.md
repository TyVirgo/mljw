## Decisions

1. **计费规则（已有引擎，补齐入口）**  
   - `estimateCourseFee(Retake)`：整门学分。  
   - `estimateCourseFee(Add)`：仅超毕业 GE/ME 总分。  
   - 汇总 `sumFeeEstimates`：多行求和。

2. **共享重建函数**  
   从申请 `items`（+ 可选 planRemaining / drop 释放）重建 `feeEstimate`，供：  
   - demo enrich（替换学期帽伪造）  
   - 详情缺/坏 `feeEstimate` 时兜底（可选，优先修存盘）  
   - 课程缴费行生成

3. **「毕业超出学分」字段**  
   仅统计 `feeEstimate.items` 中加课行（`reason` 为 ge/me graduation excess，或按 action Add）的 `billableCredits`；不含重修。

4. **课程缴费**  
   `collectLiveUnpaidLines` 优先按 `feeEstimate.items` 拆行；无 items 时再按 Add/Retake items 用同一规则回退。支持 `AddRetake` / `AddDropRetake`。

5. **Demo**  
   `ensureFeeEstimateForBillable` 改为按 items 重建两段费用，禁止把学期净变扣 creditMax 当应收。
