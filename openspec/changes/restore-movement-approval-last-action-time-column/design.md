## 列顺序

```
… | 申请次序 | 最近审核时间 | 申请日期 | 操作
```

## 最近审核时间语义

相对 `approvalStage`（当前审批节点）：

1. **首节点**（Pending Review）：前一节点 = 学生提交 → 取 `Submitted` 时间  
2. **当前节点在会签组内**：前一节点 = 会签组之前的串行节点 → 取该节点审批动作最新时间  
3. **当前节点在会签组之后**：前一节点 = 整组会签 → 取组内各分支审批动作的 **max** 时间  
4. **其它串行**：前一节点 = `getPreviousStage` 对应 stage → 取该 stage 审批动作最新时间  

审批动作：`Approved` / `Rejected` / `Update Required`。格式同日志 Created At。

## 会签分组（逻辑组，v1 仍串行推进）

| sourceKey | parallelGroup |
|-----------|---------------|
| deferment | Admissions / Library / IT / Accommodation |
| resumption | Admissions / Accommodation |
| withdrawal | Admissions / Library / IT / Counselling / Accommodation |
| programme-transfer | （无） |

Finance / ISAO / HOD 等保持串行节点。

## History / 终态

- `approvalStage === 'Approved'`：相对 Approved，前一节点为末级审批（或会签后的 AAO）  
- `approvalStage` 无效（如 `--`）：回退为 Submitted，再否则整单审批动作最新时间  
