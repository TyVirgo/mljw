## ADDED Requirements

### Requirement: 缴费名单导出弹框

缴费名单管理「导出」MUST 打开与选课结果一致的 ExportModal（字段穿梭 + 导出范围）。MUST 提供导出类型「明细」「汇总」，默认「明细」。MUST NOT 再在无弹框确认时直接下载。

#### Scenario: 打开导出

- **WHEN** 管理员点击导出
- **THEN** 出现 ExportModal，导出类型默认为明细
- **AND** 可选当前页、全部结果、已选行

### Requirement: 明细与汇总字段

汇总 MUST 使用学生汇总字段集。明细 MUST 使用学生×课程明细字段集。一次确认 MUST 导出一张 Sheet。

#### Scenario: 导出汇总

- **WHEN** 管理员选择汇总并确认
- **THEN** Excel 每行为一名学生汇总

#### Scenario: 导出明细

- **WHEN** 管理员选择明细并确认
- **THEN** Excel 每行为一门课明细，且仅包含范围内学生的课程

### Requirement: 主表勾选

主表 MUST 提供勾选列（含表头全选当前页）。选择「已选行」且无勾选时 MUST 提示，MUST NOT 导出空文件冒充成功。

#### Scenario: 已选行导出

- **WHEN** 管理员勾选若干学生、选择已选行并确认
- **THEN** 仅导出这些学生对应的汇总或明细行
