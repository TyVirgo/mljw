## 背景

选课结果 相关需求曾拆成大量增量包。本设计只描述当前应然行为。

## 目标 / 非目标

**目标：**

- 学生维主表与详情、ME 使用弹窗、R2/R3 可选容量与搜索/课程组
- R2 新老生容量「可选/总量」；R3 互释仅可选分子

**非目标：**

- 不改设置侧年级占比编辑
- 不恢复主表选课志愿列

## 决策

1. 以当前代码与最近已落地变更为真源  
2. 文档全中文  
3. 历史包名见 SOURCES.md
4. ME 老生名额使用弹窗：入口传入 `seniorCap` / `enrolledSenior` / `availableSenior`；`buildMeSeniorQuotaUsageRows` 将各层次演示拆分后合计对齐入口（剩余合计 = 入口「老生容量可选」）
5. R2（main）新老生列：`available/cap`，表头 `…（可选/总量）`；R3（supplement）仅 `available`。分母 = 课级 `quota.freshman` / `quota.senior`；不扩充时 `freshmanCap + seniorCap = totalCapacity`（有效最大总量）

## 风险

- [文档漂移] → 以代码为准并回改本包
