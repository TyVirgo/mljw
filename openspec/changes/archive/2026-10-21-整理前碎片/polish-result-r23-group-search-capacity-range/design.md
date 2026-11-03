## Context

上一 change 将 R2/R3 展平为分组行并加课程分组列；产品确认 ME/GE 均去掉该列，并需要课程组 demo 与容量区间搜索。

## Goals / Non-Goals

**Goals:**

- R2/R3 一门课一行；无课程分组列/筛选项
- ME 课程组有可见 4选3/3选2/2选1 数据；搜索可按课程组文案过滤
- 四列容量按已选（有效容量用分子）做 min–max

**Non-Goals:**

- 不改 R1；不筛有效容量分母

## Decisions

### 1. 行模型

视图改回 `listRoundCourseSummaries`；在摘要上挂 `selectionGroup`（`listRoundSectionSummaries` 保留供他用或弃用标记，不删）。

### 2. CHS ME selectionGroups

`batch-me-chs-senior-i`：`CHS1201–04` 4选3、`05–07` 3选2、`08–09` 2选1。  
`batch-me-chs-senior-ii`：对应 `CHS2301` 起同样结构。  
pad 课 `CHS1201-D20`：解析时去掉 `-D\d+$` 再匹配。

### 3. 搜索字段

```
selectionGroupKeyword
effectiveEnrolledMin/Max   // 已选分子
freshmanEnrolledMin/Max
seniorEnrolledMin/Max
specialAddedMin/Max
```

空端不限；非法非数字忽略该端。

### 4. 课程组列展示

Group 标题 + Intake 行 + 可选第三行 `selectionGroupRemark`（须选 n/共 m），便于看出 4选3。

## Risks / Trade-offs

- [Risk] pad 去后缀误匹配 → 仅结果页解析使用  
- [Trade-off] GE 显示课程组搜索框但常无结果 — ME 显示、GE 隐藏更干净（采用）

## Migration Plan

纯前端。

## Open Questions

无（有效容量按已选分子已确认）。
