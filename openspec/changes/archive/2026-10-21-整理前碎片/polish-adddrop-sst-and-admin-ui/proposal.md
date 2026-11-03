# 加退重修 SST 税费 + 管理端小清理

## Why

国际生超额学分费需加收 SST；本地生为 0。同时清理选课结果学生维度多余列、对齐批次页字号、去掉监控「仅异常学生」勾选。

## What Changes

1. **加课/重修申请表**：在总学分 / 超出学分 / 预估费用旁增加只读 **SST**；非本地生（China / International）且预估费用 > 0 时 `SST = 预估费用 × 6%`，否则 0；应付总额 = 预估费用 + SST（写入账单）。
2. **选课结果 · 学生维度**：去掉「是否重修」列（导出同步）。
3. **选课批次**：表格字号相对时间设置再大两号（12→14px）。
4. **学生选课监控**：搜索区去掉「仅异常学生」勾选（统计卡片筛异常可保留内部 `problemsOnly`）。
5. **加退详情（增量）**：「是否需要退课」只展示是/否文本，不用只读 radio；退课分节学分/原因/附件按一行两列排布（去掉整行 full）。

## Capabilities

### New Capabilities

- `adddrop-sst-fee`：加退重修超额费用的 SST 展示与计入应付总额

### Modified Capabilities

- `course-reg-result`：学生维度列表列调整（去是否重修）
- `course-reg-batch`：批次列表字体对齐时间设置后再大两号
- `course-reg-monitor`：监控搜索区去「仅异常学生」
- `course-reg-student-adddrop`：详情是否退课文本化 + 退课字段两列

## Impact

- `AddDropApplicationFormSections` / `addDropFeeRates` / 提交 payload / 详情
- `AddDropApplicationDetailBody`
- `RegistrationResultView` + 导出
- `RegistrationBatchView` 样式
- `RegistrationMonitorView` 搜索区
