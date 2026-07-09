# student-profile — 增量规格

## 新增需求

### 需求：毕业状态日志备注

详情 Status Log 应 支持毕业状态行，备注展示 Completion Batch、Completion Date、Graduation Batch、Graduation Date。

#### 场景：毕业备注四字段
- **当** 用户查看含毕业记录的 Status Log
- **则** Remarks 显示标题 Graduation 及四行批次/日期（图示 2 格式）

### 需求：退学状态日志原因来自异动类型配置

退学 Status Log 备注 应 包含 Last Date of Attendance 与 Reason；Reason 来自异动类型 WDR001 配置（`reasonId` 解析）。

#### 场景：退学原因与配置一致
- **当** 用户查看退学 Implement 或 mock 退学 Status Log
- **则** Reason 行与异动类型退学原因列表一致（如 Financial Problem、Personal Reason）
