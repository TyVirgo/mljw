## 1. 配置

- [x] 1.1 `batchRound1Quota`：默认/归一化增加 `graduateCapRatio`（默认 0.9）
- [x] 1.2 批次轮次抽屉 GE 区增加毕业生占比配置 + i18n
- [x] 1.3 抽签调用传入 `graduateCapRatio`

## 2. 分配算法

- [x] 2.1 实现按 `preferenceRank` 分层随机录取
- [x] 2.2 重写 `layoutGeRound1Roster`：毕业生封顶、分日、当日优先、waitlist 回补、额度结转
- [x] 2.3 Demo 种子补 `preferenceRank`

## 3. 收尾

- [x] 3.1 用示例场景脚本冒烟；构建通过；勾选 tasks
