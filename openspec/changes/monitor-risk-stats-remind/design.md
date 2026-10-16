## Decisions

1. **阈值**：`getCreditCompletionPct(current, max) < 50`（不含 50）；分母缺省走现有 insight 默认。
2. **口径**：五卡基于 **全量** `registrationMonitorQueue`，不随当前筛选变化。
3. **五卡文案**（短标签）：GE毕业&lt;50%、GE学期&lt;50%、ME毕业&lt;50%、ME学期&lt;50%、必修&lt;50%。
4. **提醒次数**：行字段 `remindCount`（number，默认 0）；`handleRemindConfirm` 成功后对该行 `+1`。
5. **双冻结**：`发送提醒次数` sticky `right: 操作列宽`；`操作` sticky `right: 0`；收紧身份/次数/操作列宽，操作仅「详情」「发送提醒」。
6. **详情标题**：`t('courseRegistration.monitor.detailTitle')` →「选课监控详情」；`subtitle` 置空。
7. **白名单**：删工具栏跳转与行内加入；侧栏入口保留。

## 影响文件

见 proposal Impact。
