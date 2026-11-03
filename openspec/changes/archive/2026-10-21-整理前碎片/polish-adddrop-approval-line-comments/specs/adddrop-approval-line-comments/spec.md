## ADDED Requirements

### Requirement: 单条审批行级评价意见

有课程行汇总的单条加退课审批弹窗 MUST NOT 展示表下全局 Comments。每一课程行操作列在「通过 / 不通过 / 驳回」之后 MUST 提供「添加评价意见」按钮；该行已有意见时按钮文案 MUST 为「编辑评价意见」。点击后 MUST 打开二级意见弹层（textarea、常用意见、200 字上限），保存仅写入该行。该行决策为「不通过」或「驳回」时，提交前该行评价意见 MUST 非空。提交 MUST 将各行意见写入对应 `item.lineComment`，并将有内容的行拼成整单审批日志 `comment`。批量且无课程行表时 MUST 仍使用整单 Action + Comments。

#### Scenario: 无表下全局意见、行末按钮

- **WHEN** 打开含多门课程的单条审批弹窗
- **THEN** 表下方无全局 Comments
- **AND** 每行操作列可见「添加评价意见」或「编辑评价意见」

#### Scenario: 不通过行意见必填

- **WHEN** 某行选择「不通过」或「驳回」且未填该行意见并点确定
- **THEN** 阻断提交并提示需填写评价意见

#### Scenario: 二级弹层写回该行

- **WHEN** 点击某行「添加评价意见」、填写并确认
- **THEN** 仅该行持有该意见；其它行意见不变

#### Scenario: 批量仍用整单意见

- **WHEN** 批量审批且无课程行汇总
- **THEN** 仍展示整单操作与 Comments
