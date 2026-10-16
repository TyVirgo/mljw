## ADDED Requirements

### Requirement: Empty round-status table centers message in viewport

当「本轮选课情况」无课程行时，空态文案 MUST 在表格主体可见区域内水平与垂直居中，不得仅相对超宽表单元格居中导致贴在视口左上。

#### Scenario: No volunteer rows

- **WHEN** 本轮选课情况列表为空
- **THEN** 用户在表头下方可见区域内看到居中的「未选择课程」（及可选提示），样式清晰可读
